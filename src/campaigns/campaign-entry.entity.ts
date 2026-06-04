import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Campaign } from './campaign.entity';

/** Cada participação na Roleta de Prêmios (lead capturado + prêmio sorteado). */
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

  @Column({ type: 'int', default: 0 })
  prizeIndex: number;

  @Column({ nullable: true })
  prizeLabel: string;

  @CreateDateColumn()
  createdAt: Date;
}
