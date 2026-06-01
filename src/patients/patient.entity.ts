import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { FinancialRecord } from '../financial/financial-record.entity';
import { Lead } from '../leads/lead.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  allergies: string;

  @Column({ type: 'text', nullable: true })
  contraindications: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Appointment, (a) => a.patient)
  appointments: Appointment[];

  @OneToMany(() => FinancialRecord, (f) => f.patient)
  financialRecords: FinancialRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
