import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignType, WheelSlot, QuizResult } from './campaign.entity';
import { CampaignEntry } from './campaign-entry.entity';
import { Board } from '../boards/board.entity';
import { Card } from '../cards/card.entity';

interface SpinDto { name: string; phone?: string; email?: string }
interface QuizDto { name: string; phone?: string; email?: string; instagram?: string; answers: number[] }

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign) private repo: Repository<Campaign>,
    @InjectRepository(CampaignEntry) private entryRepo: Repository<CampaignEntry>,
    @InjectRepository(Board) private boardRepo: Repository<Board>,
    @InjectRepository(Card) private cardRepo: Repository<Card>,
  ) {}

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  async findOne(id: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Campanha não encontrada');
    return c;
  }

  async findBySlug(slug: string) {
    const c = await this.repo.findOne({ where: { slug, active: true } });
    if (!c) throw new NotFoundException('Página não encontrada');
    return c;
  }

  async create(data: Partial<Campaign>) {
    delete (data as any).id;
    if (!data.slug) data.slug = this.generateSlug(data.title || '');
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Campaign>) {
    await this.findOne(id);
    delete (data as any).id;
    await this.repo.update(id, data as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    const c = await this.findOne(id);
    return this.repo.remove(c);
  }

  async trackView(slug: string) {
    await this.repo.increment({ slug }, 'views', 1);
  }

  async trackClick(slug: string) {
    await this.repo.increment({ slug }, 'clicks', 1);
  }

  // ---- Roleta de Prêmios ----

  /** Registra um giro: sorteia o prêmio (ponderado, no servidor), grava a participação e cria um lead. */
  async spin(slug: string, dto: SpinDto) {
    const campaign = await this.findBySlug(slug);
    if (campaign.campaignType !== CampaignType.WHEEL) {
      throw new BadRequestException('Esta campanha não é uma roleta');
    }
    const slots: WheelSlot[] = campaign.wheelConfig?.slots || [];
    if (slots.length < 2) {
      throw new BadRequestException('Roleta sem prêmios configurados');
    }
    if (!dto.name?.trim()) {
      throw new BadRequestException('Nome é obrigatório');
    }

    const phoneDigits = (dto.phone || '').replace(/\D/g, '');

    // Anti-duplicação: mesmo WhatsApp/email não gira de novo (retorna o prêmio anterior)
    if (campaign.wheelConfig?.onePerPerson && (phoneDigits || dto.email)) {
      const existing = await this.entryRepo
        .createQueryBuilder('e')
        .where('e.campaignId = :cid', { cid: campaign.id })
        .andWhere('(e.phone = :phone OR (e.email IS NOT NULL AND e.email = :email))', {
          phone: phoneDigits,
          email: dto.email || '__none__',
        })
        .getOne();
      if (existing) {
        return {
          prizeIndex: existing.prizeIndex,
          prizeLabel: existing.prizeLabel,
          repeat: true,
          slots,
        };
      }
    }

    // Sorteio ponderado
    const prizeIndex = this.weightedPick(slots);
    const prizeLabel = slots[prizeIndex].label;

    // Grava participação
    await this.entryRepo.save(this.entryRepo.create({
      campaignId: campaign.id,
      name: dto.name.trim(),
      phone: phoneDigits || undefined,
      email: dto.email || undefined,
      prizeIndex,
      prizeLabel,
    }));
    await this.repo.increment({ id: campaign.id }, 'clicks', 1);

    // Cria lead no funil (board "Leads", primeira coluna)
    await this.createLeadCard(campaign, dto, prizeLabel, phoneDigits);

    return { prizeIndex, prizeLabel, repeat: false, slots };
  }

  /** Lista participações/ganhadores de uma campanha (painel). */
  listEntries(campaignId: string) {
    return this.entryRepo.find({ where: { campaignId }, order: { createdAt: 'DESC' } });
  }

  private weightedPick(slots: WheelSlot[]): number {
    const weights = slots.map((s) => (s.weight && s.weight > 0 ? s.weight : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r < 0) return i;
    }
    return weights.length - 1;
  }

  private async createLeadCard(campaign: Campaign, dto: SpinDto, prizeLabel: string, phoneDigits: string) {
    try {
      const board = await this.boardRepo.findOne({
        where: { name: 'Leads' },
        relations: { columns: true },
      });
      if (!board?.columns?.length) return;
      const firstColumn = [...board.columns].sort((a, b) => a.order - b.order)[0];
      const count = await this.cardRepo.count({ where: { column: { id: firstColumn.id } } });
      await this.cardRepo.save(this.cardRepo.create({
        title: dto.name.trim(),
        phone: phoneDigits || undefined,
        email: dto.email || undefined,
        source: 'roleta',
        description: `🎡 Roleta "${campaign.title}" • Prêmio: ${prizeLabel}`,
        column: { id: firstColumn.id } as any,
        order: count,
      }));
    } catch {
      // não bloqueia o giro se a criação do lead falhar
    }
  }

  // ---- Quiz de Perfil ----

  /** Versão pública saneada do quiz: remove a resposta correta e os prêmios do payload exposto na landing. */
  async findBySlugPublic(slug: string) {
    const c = await this.findBySlug(slug);
    if (c.campaignType === CampaignType.QUIZ && c.quizConfig) {
      const qc: any = { ...c.quizConfig };
      if (Array.isArray(qc.questions)) {
        // remove correctIndex (não expor a resposta certa ao cliente)
        qc.questions = qc.questions.map((q: any) => {
          const { correctIndex, ...rest } = q;
          void correctIndex;
          return rest;
        });
      }
      delete qc.prizeTiers; // faixas/prêmios são revelados só no resultado (resposta do submit)
      if (Array.isArray(qc.results)) qc.results = qc.results.map((r: any) => ({ key: r.key, title: r.title }));
      return { ...c, quizConfig: qc };
    }
    return c;
  }

  /** Registra a resposta de um quiz: apura o resultado, define o prêmio, grava a participação e cria o lead. */
  async submitQuiz(slug: string, dto: QuizDto) {
    const campaign = await this.findBySlug(slug);
    if (campaign.campaignType !== CampaignType.QUIZ) {
      throw new BadRequestException('Esta campanha não é um quiz');
    }
    const cfg = campaign.quizConfig || {};
    const questions = cfg.questions || [];
    const mode = cfg.mode === 'score' ? 'score' : 'profile';
    if (questions.length < 1) {
      throw new BadRequestException('Quiz sem perguntas configuradas');
    }
    if (mode === 'profile' && (cfg.results || []).length < 1) {
      throw new BadRequestException('Quiz sem resultados configurados');
    }
    if (!dto.name?.trim()) {
      throw new BadRequestException('Nome é obrigatório');
    }
    if (!Array.isArray(dto.answers)) {
      throw new BadRequestException('Respostas inválidas');
    }

    const phoneDigits = (dto.phone || '').replace(/\D/g, '');
    const instagram = (dto.instagram || '').replace(/^@/, '').trim() || undefined;

    // Anti-duplicação: mesmo WhatsApp/email não responde de novo (recalcula o resultado anterior)
    if (cfg.onePerPerson && (phoneDigits || dto.email)) {
      const existing = await this.entryRepo
        .createQueryBuilder('e')
        .where('e.campaignId = :cid', { cid: campaign.id })
        .andWhere('(e.phone = :phone OR (e.email IS NOT NULL AND e.email = :email))', {
          phone: phoneDigits || '__none__',
          email: dto.email || '__none__',
        })
        .getOne();
      if (existing && Array.isArray(existing.answers)) {
        const prev = this.evaluateQuiz(campaign, existing.answers);
        return { result: prev.public, repeat: true };
      }
    }

    // Apuração do resultado (perfil ou acertos, conforme o modo)
    const evald = this.evaluateQuiz(campaign, dto.answers);

    // Grava participação
    await this.entryRepo.save(this.entryRepo.create({
      campaignId: campaign.id,
      name: dto.name.trim(),
      phone: phoneDigits || undefined,
      email: dto.email || undefined,
      instagram,
      resultKey: evald.key,
      resultLabel: evald.resultLabel,
      prizeLabel: evald.prizeLabel || undefined,
      answers: dto.answers,
    }));
    await this.repo.increment({ id: campaign.id }, 'clicks', 1);

    // Cria lead no funil (board "Leads", primeira coluna)
    await this.createQuizLeadCard(campaign, dto, evald, phoneDigits, instagram);

    return { result: evald.public, repeat: false };
  }

  /** Apura o quiz no modo configurado e devolve dados internos + payload público. */
  private evaluateQuiz(campaign: Campaign, answers: number[]) {
    const cfg = campaign.quizConfig || {};
    return cfg.mode === 'score'
      ? this.evaluateScore(campaign, answers)
      : this.evaluateProfile(campaign, answers);
  }

  /** Modo 'profile': cada resposta soma 1 ponto ao resultado que ela favorece; o mais votado vence. */
  private evaluateProfile(campaign: Campaign, answers: number[]) {
    const cfg = campaign.quizConfig || {};
    const questions = cfg.questions || [];
    const results = cfg.results || [];
    const tally: Record<string, number> = {};
    results.forEach((r) => (tally[r.key] = 0));

    questions.forEach((q, qi) => {
      const opt = q.options?.[answers[qi]];
      if (opt && opt.resultKey && tally[opt.resultKey] !== undefined) tally[opt.resultKey] += 1;
    });

    // Vencedor = maior pontuação; empate resolve pela ordem dos resultados configurados.
    let best: QuizResult = results[0];
    let bestScore = -1;
    for (const r of results) {
      if (tally[r.key] > bestScore) { bestScore = tally[r.key]; best = r; }
    }
    return {
      key: best.key,
      resultLabel: best.title,
      prizeLabel: best.prizeLabel,
      leadInfo: `Perfil: ${best.title} • Prêmio: ${best.prizeLabel}`,
      public: {
        mode: 'profile' as const,
        key: best.key, title: best.title, description: best.description,
        prizeLabel: best.prizeLabel, prizeDescription: best.prizeDescription,
        image: best.image, emoji: best.emoji, hasPrize: true,
      },
    };
  }

  /** Modo 'score': conta acertos e escolhe a faixa de prêmio (maior minCorrect ≤ acertos). */
  private evaluateScore(campaign: Campaign, answers: number[]) {
    const cfg = campaign.quizConfig || {};
    const questions = cfg.questions || [];
    const total = questions.length;
    let correct = 0;
    questions.forEach((q, qi) => {
      if (typeof q.correctIndex === 'number' && answers[qi] === q.correctIndex) correct += 1;
    });

    const tiers = [...(cfg.prizeTiers || [])].sort((a, b) => a.minCorrect - b.minCorrect);
    let tier: typeof tiers[number] | null = null;
    for (const t of tiers) { if (correct >= t.minCorrect) tier = t; }
    const hasPrize = !!tier;

    return {
      key: String(correct),
      resultLabel: `${correct}/${total} acertos`,
      prizeLabel: tier?.label || '',
      leadInfo: `Acertos: ${correct}/${total}${hasPrize ? ` • Prêmio: ${tier!.label}` : ' • Sem prêmio'}`,
      public: {
        mode: 'score' as const,
        correct, total, hasPrize,
        prizeLabel: tier?.label || '',
        prizeDescription: tier?.description,
        emoji: tier?.emoji || (hasPrize ? '🎉' : '😅'),
        noPrizeTitle: cfg.noPrizeTitle,
        noPrizeMessage: cfg.noPrizeMessage,
      },
    };
  }

  private async createQuizLeadCard(
    campaign: Campaign,
    dto: QuizDto,
    evald: { leadInfo: string },
    phoneDigits: string,
    instagram?: string,
  ) {
    try {
      const board = await this.boardRepo.findOne({
        where: { name: 'Leads' },
        relations: { columns: true },
      });
      if (!board?.columns?.length) return;
      const firstColumn = [...board.columns].sort((a, b) => a.order - b.order)[0];
      const count = await this.cardRepo.count({ where: { column: { id: firstColumn.id } } });
      const igLine = instagram ? ` • Instagram: @${instagram}` : '';
      await this.cardRepo.save(this.cardRepo.create({
        title: dto.name.trim(),
        phone: phoneDigits || undefined,
        email: dto.email || undefined,
        source: 'quiz',
        description: `🧩 Quiz "${campaign.title}" • ${evald.leadInfo}${igLine}`,
        column: { id: firstColumn.id } as any,
        order: count,
      }));
    } catch {
      // não bloqueia o quiz se a criação do lead falhar
    }
  }

  /** Proxy de imagem (logo/fundo) para a geração da arte de Stories sem "tainted canvas". */
  async fetchAsset(url: string): Promise<{ buffer: Buffer; contentType: string }> {
    if (!/^https?:\/\//i.test(url)) throw new BadRequestException('URL inválida');
    const res = await fetch(url);
    if (!res.ok) throw new NotFoundException('Imagem não encontrada');
    const contentType = res.headers.get('content-type') || 'image/png';
    if (!/^image\//.test(contentType)) throw new BadRequestException('A URL não é uma imagem');
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType };
  }

  private generateSlug(title: string): string {
    return title.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);
  }
}
