import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement, MovementType } from './stock-movement.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectRepository(StockMovement) private repo: Repository<StockMovement>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  async create(data: any) {
    const movement = this.repo.create(data);
    const saved = await this.repo.save(movement);
    // Update product quantity
    const product = await this.productRepo.findOne({ where: { id: data.product?.id || data.productId } });
    if (product) {
      const qty = data.type === MovementType.IN ? +product.quantity + +data.quantity : +product.quantity - +data.quantity;
      await this.productRepo.update(product.id, { quantity: qty });
    }
    return saved;
  }
}
