import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { BoardColumn } from '../board-columns/board-column.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BoardColumn, col => col.cards, { onDelete: 'CASCADE', eager: true })
  column: BoardColumn;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Campos flexíveis para Leads/SDR
  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  procedureInterest: string;

  @Column({ nullable: true })
  source: string;

  // Valor potencial do lead (R$) — usado no pipeline comercial
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
