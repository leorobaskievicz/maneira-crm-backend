import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Product } from '../products/product.entity';
import { Appointment } from '../appointments/appointment.entity';

export enum MovementType {
  IN = 'in',
  OUT = 'out',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ nullable: true })
  reason: string;

  @ManyToOne(() => Appointment, { nullable: true, eager: true })
  appointment: Appointment;

  @CreateDateColumn()
  createdAt: Date;
}
