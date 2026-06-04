import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CTAType { WHATSAPP = 'whatsapp', FORM = 'form' }
export enum CampaignType { LANDING = 'landing', WHEEL = 'wheel' }

/** Configuração da Roleta de Prêmios (armazenada em JSON). */
export interface WheelSlot {
  label: string;
  color: string;
  weight: number; // peso/probabilidade relativa do prêmio
}
export interface WheelConfig {
  theme?: string;
  backgroundImage?: string;
  spinDurationMs?: number;
  successTitle?: string;
  successMessage?: string;
  scheduleMessage?: string; // mensagem pré-preenchida do WhatsApp para agendar avaliação
  onePerPerson?: boolean;   // impede o mesmo WhatsApp de girar 2x
  slots?: WheelSlot[];
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CampaignType, default: CampaignType.LANDING })
  campaignType: CampaignType;

  @Column({ type: 'json', nullable: true })
  wheelConfig: WheelConfig;

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
