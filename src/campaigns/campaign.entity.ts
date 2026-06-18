import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CTAType { WHATSAPP = 'whatsapp', FORM = 'form' }
export enum CampaignType { LANDING = 'landing', WHEEL = 'wheel', QUIZ = 'quiz' }

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

/** Configuração do Quiz de Perfil (armazenada em JSON). */
export interface QuizOption {
  label: string;
  resultKey: string; // qual resultado esta resposta favorece
}
export interface QuizQuestion {
  text: string;
  image?: string;       // imagem opcional ilustrando a pergunta
  options: QuizOption[];
}
export interface QuizResult {
  key: string;              // identificador estável (ex: "pele-madura")
  title: string;            // título do perfil (ex: "Pele Madura")
  description: string;      // recomendação/descrição exibida no final
  prizeLabel: string;       // prêmio que este resultado ganha (ex: "20% OFF Skinbooster")
  prizeDescription?: string;
  image?: string;           // ilustração opcional do resultado
  emoji?: string;           // emoji decorativo do resultado
}
export interface QuizConfig {
  theme?: string;
  logo?: string;            // logo da clínica — usado na arte de Stories
  backgroundImage?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
  introTitle?: string;      // título da tela inicial
  introSubtitle?: string;
  askInstagram?: boolean;   // pede @ do Instagram (opcional) para repostar/encontrar o lead
  collectAtStart?: boolean; // coleta nome/WhatsApp antes do quiz (padrão: true)
  onePerPerson?: boolean;   // impede o mesmo WhatsApp de responder 2x
  successTitle?: string;    // título da tela de resultado (ex: "Seu resultado:")
  scheduleMessage?: string; // mensagem pré-preenchida do WhatsApp para agendar/resgatar
  shareCaption?: string;    // legenda sugerida ao compartilhar nos Stories
  shareHashtag?: string;    // @ / hashtag da clínica exibido na arte
  questions?: QuizQuestion[];
  results?: QuizResult[];
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CampaignType, default: CampaignType.LANDING })
  campaignType: CampaignType;

  @Column({ type: 'json', nullable: true })
  wheelConfig: WheelConfig;

  @Column({ type: 'json', nullable: true })
  quizConfig: QuizConfig;

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
