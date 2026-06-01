import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}
  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } as any }); }
  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Não encontrado');
    return item;
  }
  create(data: Partial<Product>) { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: Partial<Product>) {
    await this.findOne(id);
    await this.repo.update(id, data as any);
    return this.findOne(id);
  }
  async remove(id: string) {
    const item = await this.findOne(id);
    return this.repo.remove(item);
  }
}
