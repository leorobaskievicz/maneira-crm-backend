import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './board.entity';
import { BoardColumn } from '../board-columns/board-column.entity';

@Injectable()
export class BoardsService implements OnModuleInit {
  constructor(
    @InjectRepository(Board) private repo: Repository<Board>,
  ) {}

  async onModuleInit() {
    const existing = await this.repo.findOne({ where: { name: 'Leads' } });
    if (!existing) {
      const board = this.repo.create({
        name: 'Leads',
        description: 'Funil de captação de clientes',
        columns: [
          { name: 'Novo', color: '#1976D2', order: 0 },
          { name: 'Contatado', color: '#F57C00', order: 1 },
          { name: 'Agendado', color: '#7B1FA2', order: 2 },
          { name: 'Convertido', color: '#388E3C', order: 3 },
          { name: 'Perdido', color: '#9E9E9E', order: 4 },
        ],
      });
      await this.repo.save(board);
    }
  }
  
  findAll() { return this.repo.find({ order: { createdAt: 'ASC' } }); }
  
  async findOne(id: string) {
    const board = await this.repo.findOne({ 
      where: { id },
      relations: { columns: { cards: true } },
    });
    if (!board) throw new NotFoundException('Board não encontrado');
    
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
