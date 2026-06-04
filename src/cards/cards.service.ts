import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './card.entity';

@Injectable()
export class CardsService {
  constructor(@InjectRepository(Card) private repo: Repository<Card>) {}
  
  create(data: Partial<Card>) { delete (data as any).id; return this.repo.save(this.repo.create(data)); }
  
  async update(id: string, data: Partial<Card>) {
    await this.repo.update(id, data as any);
    return this.repo.findOne({ where: { id } });
  }

  async updateOrderAndColumn(id: string, columnId: string, order: number, otherCards: { id: string; order: number }[]) {
    // Atualiza o cartão movido
    await this.repo.update(id, { column: { id: columnId }, order });
    
    // Atualiza os outros cartões da coluna destino para reordenar
    if (otherCards && otherCards.length > 0) {
      await Promise.all(otherCards.map(c => this.repo.update(c.id, { order: c.order })));
    }
    return { success: true };
  }
  
  async remove(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException();
    return this.repo.remove(item);
  }
}
