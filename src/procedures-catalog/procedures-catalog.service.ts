import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcedureCatalog } from './procedure-catalog.entity';

@Injectable()
export class ProcedureCatalogsService {
  constructor(@InjectRepository(ProcedureCatalog) private repo: Repository<ProcedureCatalog>) {}
  findAll() { return this.repo.find({ order: { name: 'ASC' } }); }
  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Procedimento não encontrado');
    return item;
  }
  create(data: Partial<ProcedureCatalog>) { delete (data as any).id; return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<ProcedureCatalog>) {
    await this.findOne(id);
    await this.repo.update(id, data as any);
    return this.findOne(id);
  }
  async remove(id: string) {
    const item = await this.findOne(id);
    return this.repo.remove(item);
  }
}
