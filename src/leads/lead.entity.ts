import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  SCHEDULED = 'scheduled',
  CONVERTED = 'converted',
  LOST = 'lost',
}

export enum LeadSource {
  GOOGLE = 'google',
  INSTAGRAM = 'instagram',
  REFERRAL = 'referral',
  WHATSAPP = 'whatsapp',
  WALK_IN = 'walk_in',
  OTHER = 'other',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  procedureInterest: string;

  @Column({ type: 'enum', enum: LeadSource, default: LeadSource.OTHER })
  source: LeadSource;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
