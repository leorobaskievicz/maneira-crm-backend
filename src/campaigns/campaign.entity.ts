import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CTAType { WHATSAPP = 'whatsapp', FORM = 'form' }

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ type: 'simple-array', nullable: true })
  procedures: string[];

  @Column({ type: 'enum', enum: CTAType, default: CTAType.WHATSAPP })
  ctaType: CTAType;

  @Column({ nullable: true })
  ctaText: string;

  @Column({ nullable: true })
  whatsappNumber: string;

  @Column({ default: '#A0585A' })
  primaryColor: string;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
