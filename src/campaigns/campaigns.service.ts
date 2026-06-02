import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';

@Injectable()
export class CampaignsService {
  constructor(@InjectRepository(Campaign) private repo: Repository<Campaign>) {}

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
    if (!data.slug) data.slug = this.generateSlug(data.title || '');
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Campaign>) {
    await this.findOne(id);
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

  private generateSlug(title: string): string {
    return title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);
  }
}
