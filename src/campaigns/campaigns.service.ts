import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignType, WheelSlot } from './campaign.entity';
import { CampaignEntry } from './campaign-entry.entity';
import { Board } from '../boards/board.entity';
import { Card } from '../cards/card.entity';

interface SpinDto { name: string; phone?: string; email?: string }

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

  private generateSlug(title: string): string {
    return title.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);
  }
}
