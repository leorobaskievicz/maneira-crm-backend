import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Campaign } from './campaign.entity';

/** Cada participação na Roleta de Prêmios ou no Quiz de Perfil (lead capturado + prêmio). */
@Entity('campaign_entries')
export class CampaignEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  campaignId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  instagram: string;

  @Column({ type: 'int', default: 0 })
  prizeIndex: number;

  @Column({ nullable: true })
  prizeLabel: string;

  // Quiz: resultado/perfil alcançado e as respostas escolhidas
  @Column({ nullable: true })
  resultKey: string;

  @Column({ nullable: true })
  resultLabel: string;

  @Column({ type: 'json', nullable: true })
  answers: number[];

  @CreateDateColumn()
  createdAt: Date;
}
