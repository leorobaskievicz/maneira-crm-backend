import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Patient } from './patient.entity';

@Injectable()
export class PatientsService {
  constructor(@InjectRepository(Patient) private repo: Repository<Patient>) {}

  findAll(search?: string) {
    if (search) return this.repo.find({ where: [{ name: Like(`%${search}%`) }, { phone: Like(`%${search}%`) }] });
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id }, relations: { appointments: true, financialRecords: true } });
    if (!p) throw new NotFoundException('Paciente não encontrado');
    return p;
  }

  create(data: Partial<Patient>) { return this.repo.save(this.repo.create(data)); }

  async update(id: string, data: Partial<Patient>) {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.update(id, { active: false });
    return { message: 'Paciente desativado' };
  }
}
