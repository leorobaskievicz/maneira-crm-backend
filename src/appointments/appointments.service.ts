import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from './appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(@InjectRepository(Appointment) private repo: Repository<Appointment>) {}

  findAll(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return this.repo.find({
        where: { scheduledAt: Between(new Date(startDate), new Date(endDate)) },
        order: { scheduledAt: 'ASC' },
      });
    }
    return this.repo.find({ order: { scheduledAt: 'ASC' } });
  }

  async findOne(id: string) {
    const a = await this.repo.findOne({ where: { id }, relations: { medicalRecord: true } });
    if (!a) throw new NotFoundException('Agendamento não encontrado');
    return a;
  }

  findByPatient(patientId: string) {
    return this.repo.find({ where: { patient: { id: patientId } }, order: { scheduledAt: 'DESC' } });
  }

  create(data: any) { return this.repo.save(this.repo.create(data)); }

  async update(id: string, data: any) {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const a = await this.findOne(id);
    return this.repo.remove(a);
  }
}
