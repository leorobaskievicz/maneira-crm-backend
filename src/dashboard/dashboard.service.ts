import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { FinancialRecord, PaymentStatus } from '../financial/financial-record.entity';
import { Patient } from '../patients/patient.entity';
import { Product } from '../products/product.entity';
import { Lead } from '../leads/lead.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    @InjectRepository(FinancialRecord) private financialRepo: Repository<FinancialRecord>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
  ) {}

  async getOverview() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [todayAppointments, monthRevenue, totalPatients, lowStockProducts, newLeads] = await Promise.all([
      this.appointmentRepo.find({ where: { scheduledAt: Between(todayStart, todayEnd) }, order: { scheduledAt: 'ASC' } }),
      this.financialRepo.find({ where: { createdAt: Between(monthStart, monthEnd), status: PaymentStatus.PAID } }),
      this.patientRepo.count({ where: { active: true } }),
      this.productRepo.createQueryBuilder('p').where('p.quantity <= p.minQuantity AND p.active = true').getMany(),
      this.leadRepo.count({ where: { status: 'new' as any } }),
    ]);

    const monthRevenueTotal = monthRevenue.reduce((sum, r) => sum + Number(r.amount), 0);
    const ticketMedio = monthRevenue.length ? monthRevenueTotal / monthRevenue.length : 0;

    return {
      today: {
        appointments: todayAppointments,
        count: todayAppointments.length,
      },
      month: {
        revenue: monthRevenueTotal,
        transactions: monthRevenue.length,
        ticketMedio,
      },
      totals: {
        activePatients: totalPatients,
        newLeads,
      },
      alerts: {
        lowStock: lowStockProducts,
      },
    };
  }
}
