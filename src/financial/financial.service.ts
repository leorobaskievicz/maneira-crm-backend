import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FinancialRecord } from './financial-record.entity';

@Injectable()
export class FinancialRecordsService {
  constructor(@InjectRepository(FinancialRecord) private repo: Repository<FinancialRecord>) {}

  findAll(startDate?: string, endDate?: string) {
    if (startDate && endDate)
      return this.repo.find({ where: { createdAt: Between(new Date(startDate), new Date(endDate)) }, order: { createdAt: 'DESC' } });
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  create(data: any) { delete data.id; return this.repo.save(this.repo.create(data)); }

  findByPatient(patientId: string) {
    return this.repo.find({ where: { patient: { id: patientId } }, order: { createdAt: 'DESC' } });
  }

  async summary(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const records = await this.repo.find({ where: { createdAt: Between(start, end) } });
    const total = records.reduce((sum, r) => sum + Number(r.amount), 0);
    return { total, count: records.length, records };
  }
}
