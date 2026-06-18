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

  /** Registra a resposta de um quiz: apura o resultado, define o prêmio, grava a participação e cria o lead. */
  async submitQuiz(slug: string, dto: QuizDto) {
    const campaign = await this.findBySlug(slug);
    if (campaign.campaignType !== CampaignType.QUIZ) {
      throw new BadRequestException('Esta campanha não é um quiz');
    }
    const cfg = campaign.quizConfig || {};
    const questions = cfg.questions || [];
    const results = cfg.results || [];
    if (questions.length < 1 || results.length < 1) {
      throw new BadRequestException('Quiz sem perguntas ou resultados configurados');
    }
    if (!dto.name?.trim()) {
      throw new BadRequestException('Nome é obrigatório');
    }
    if (!Array.isArray(dto.answers)) {
      throw new BadRequestException('Respostas inválidas');
    }

    const phoneDigits = (dto.phone || '').replace(/\D/g, '');
    const instagram = (dto.instagram || '').replace(/^@/, '').trim() || undefined;

    // Anti-duplicação: mesmo WhatsApp/email não responde de novo (retorna o resultado anterior)
    if (cfg.onePerPerson && (phoneDigits || dto.email)) {
      const existing = await this.entryRepo
        .createQueryBuilder('e')
        .where('e.campaignId = :cid', { cid: campaign.id })
        .andWhere('(e.phone = :phone OR (e.email IS NOT NULL AND e.email = :email))', {
          phone: phoneDigits || '__none__',
          email: dto.email || '__none__',
        })
        .getOne();
      if (existing && existing.resultKey) {
        const prev = results.find((r) => r.key === existing.resultKey) || results[0];
        return { result: this.publicResult(prev), repeat: true };
      }
    }

    // Apuração do resultado (perfil mais escolhido)
    const result = this.computeQuizResult(campaign, dto.answers);

    // Grava participação
    await this.entryRepo.save(this.entryRepo.create({
      campaignId: campaign.id,
      name: dto.name.trim(),
      phone: phoneDigits || undefined,
      email: dto.email || undefined,
      instagram,
      resultKey: result.key,
      resultLabel: result.title,
      prizeLabel: result.prizeLabel,
      answers: dto.answers,
    }));
    await this.repo.increment({ id: campaign.id }, 'clicks', 1);

    // Cria lead no funil (board "Leads", primeira coluna)
    await this.createQuizLeadCard(campaign, dto, result, phoneDigits, instagram);

    return { result: this.publicResult(result), repeat: false };
  }

  /** Apura o resultado do quiz: cada resposta soma 1 ponto ao resultado que ela favorece; o mais votado vence. */
  private computeQuizResult(campaign: Campaign, answers: number[]): QuizResult {
    const cfg = campaign.quizConfig || {};
    const questions = cfg.questions || [];
    const results = cfg.results || [];
    const tally: Record<string, number> = {};
    results.forEach((r) => (tally[r.key] = 0));

    questions.forEach((q, qi) => {
      const choice = answers[qi];
      const opt = q.options?.[choice];
      if (opt && opt.resultKey && tally[opt.resultKey] !== undefined) {
        tally[opt.resultKey] += 1;
      }
    });

    // Vencedor = maior pontuação; empate resolve pela ordem dos resultados configurados.
    let best = results[0];
    let bestScore = -1;
    for (const r of results) {
      if (tally[r.key] > bestScore) { bestScore = tally[r.key]; best = r; }
    }
    return best;
  }

  /** Versão pública/segura do resultado (sem dados internos). */
  private publicResult(r: QuizResult) {
    return {
      key: r.key,
      title: r.title,
      description: r.description,
      prizeLabel: r.prizeLabel,
      prizeDescription: r.prizeDescription,
      image: r.image,
      emoji: r.emoji,
    };
  }

  private async createQuizLeadCard(campaign: Campaign, dto: QuizDto, result: QuizResult, phoneDigits: string, instagram?: string) {
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
        description: `🧩 Quiz "${campaign.title}" • Perfil: ${result.title} • Prêmio: ${result.prizeLabel}${igLine}`,
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
