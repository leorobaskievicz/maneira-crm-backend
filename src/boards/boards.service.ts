import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './board.entity';

@Injectable()
export class BoardsService {
  constructor(@InjectRepository(Board) private repo: Repository<Board>) {}
  
  findAll() { return this.repo.find({ order: { createdAt: 'ASC' } }); }
  
  async findOne(id: string) {
    const board = await this.repo.findOne({ 
      where: { id },
      relations: { columns: { cards: true } },
    });
    if (!board) throw new NotFoundException('Board não encontrado');
    
    // Ordenar colunas e cards
    board.columns.sort((a, b) => a.order - b.order);
    board.columns.forEach(c => {
      if (c.cards) c.cards.sort((a, b) => a.order - b.order);
    });
    
    return board;
  }
  
  create(data: Partial<Board>) { return this.repo.save(this.repo.create(data)); }
  
  async update(id: string, data: Partial<Board>) {
    await this.repo.update(id, data as any);
    return this.findOne(id);
  }
  
  async remove(id: string) {
    const item = await this.findOne(id);
    return this.repo.remove(item);
  }
}
