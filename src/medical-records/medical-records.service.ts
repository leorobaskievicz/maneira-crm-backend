import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';

@Injectable()
export class MedicalRecordsService {
  constructor(@InjectRepository(MedicalRecord) private repo: Repository<MedicalRecord>) {}
  findByPatient(patientId: string) { return this.repo.find({ where: { patient: { id: patientId } }, order: { createdAt: 'DESC' } }); }
  async findOne(id: string) {
    const r = await this.repo.findOne({ where: { id }, relations: { appointment: true } });
    if (!r) throw new NotFoundException('Prontuário não encontrado');
    return r;
  }
  create(data: any) { return this.repo.save(this.repo.create(data)); }
  async update(id: string, data: any) {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }
}
