import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './lead.entity';

@Injectable()
export class LeadsService {
  constructor(@InjectRepository(Lead) private repo: Repository<Lead>) {}
  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } as any }); }
  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Não encontrado');
    return item;
  }
  create(data: Partial<Lead>) { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Lead>) {
    await this.findOne(id);
    await this.repo.update(id, data as any);
    return this.findOne(id);
  }
  async remove(id: string) {
    const item = await this.findOne(id);
    return this.repo.remove(item);
  }
}
