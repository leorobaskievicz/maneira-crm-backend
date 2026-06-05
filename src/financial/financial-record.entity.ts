import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Patient } from '../patients/patient.entity';
import { Appointment } from '../appointments/appointment.entity';

export enum PaymentMethod {
  CASH = 'cash',
  PIX = 'pix',
  DEBIT = 'debit',
  CREDIT = 'credit',
  INSTALLMENT = 'installment',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('financial_records')
export class FinancialRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, (p) => p.financialRecords, { nullable: true, eager: true })
  patient: Patient;

  @ManyToOne(() => Appointment, { nullable: true, eager: true })
  appointment: Appointment;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.PIX })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PAID })
  status: PaymentStatus;

  @Column({ nullable: true })
  description: string;

  // Itens da venda (procedimentos/produtos). amount = total da venda.
  @Column({ type: 'json', nullable: true })
  items: { type: 'procedure' | 'product' | 'other'; name: string; quantity: number; unitPrice: number }[];

  // Valor efetivamente recebido (para vendas parciais). Se >= amount, status = paid.
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  received: number;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
