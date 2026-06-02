import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardColumn } from './board-column.entity';

@Injectable()
export class BoardColumnsService {
  constructor(@InjectRepository(BoardColumn) private repo: Repository<BoardColumn>) {}
  
  create(data: Partial<BoardColumn>) { return this.repo.save(this.repo.create(data)); }
  
  async update(id: string, data: Partial<BoardColumn>) {
    await this.repo.update(id, data as any);
    return this.repo.findOne({ where: { id } });
  }

  async updateOrder(columns: { id: string; order: number }[]) {
    // Atualiza a ordem de várias colunas
    await Promise.all(columns.map(c => this.repo.update(c.id, { order: c.order })));
    return { success: true };
  }
  
  async remove(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException();
    return this.repo.remove(item);
  }
}
