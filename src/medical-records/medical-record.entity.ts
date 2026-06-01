import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Patient } from '../patients/patient.entity';

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Appointment, (a) => a.medicalRecord)
  @JoinColumn()
  appointment: Appointment;

  @ManyToOne(() => Patient)
  patient: Patient;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  productsUsed: { productId: string; productName: string; quantity: number }[];

  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
