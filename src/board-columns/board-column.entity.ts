import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Board } from '../boards/board.entity';
import { Card } from '../cards/card.entity';

@Entity('board_columns')
export class BoardColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Board, board => board.columns, { onDelete: 'CASCADE' })
  board: Board;

  @Column()
  name: string;

  @Column({ default: '#E0E0E0' })
  color: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => Card, card => card.column, { cascade: true })
  cards: Card[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
