import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { FinancialRecord, PaymentStatus } from '../financial/financial-record.entity';
import { Patient } from '../patients/patient.entity';
import { Product } from '../products/product.entity';
import { Lead } from '../leads/lead.entity';
import { Board } from '../boards/board.entity';

const SOURCE_LABELS: Record<string, string> = {
  google: 'Google',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  referral: 'Indicação',
  walk_in: 'Espontâneo',
  roleta: 'Roleta',
  other: 'Outro',
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    @InjectRepository(FinancialRecord) private financialRepo: Repository<FinancialRecord>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Board) private boardRepo: Repository<Board>,
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

  /** Métricas comerciais do funil de Leads (pipeline, origem, leads parados). */
  async getCommercial() {
    const board = await this.boardRepo.findOne({
      where: { name: 'Leads' },
      relations: { columns: { cards: true } },
    });

    if (!board) {
      return {
        pipeline: [],
        bySource: [],
        totals: { leads: 0, value: 0 },
        stalled: { count: 0, days: 7 },
      };
    }

    const columns = [...(board.columns || [])].sort((a, b) => a.order - b.order);

    // Funil por etapa
    const pipeline = columns.map((col) => {
      const cards = col.cards || [];
      return {
        name: col.name,
        color: col.color,
        count: cards.length,
        value: cards.reduce((s, c) => s + Number(c.value || 0), 0),
      };
    });

    // Leads por origem
    const allCards = columns.flatMap((col) => col.cards || []);
    const sourceMap = new Map<string, { count: number; value: number }>();
    for (const card of allCards) {
      const key = card.source || 'other';
      const acc = sourceMap.get(key) || { count: 0, value: 0 };
      acc.count += 1;
      acc.value += Number(card.value || 0);
      sourceMap.set(key, acc);
    }
    const bySource = [...sourceMap.entries()]
      .map(([source, v]) => ({ source, label: SOURCE_LABELS[source] || source, ...v }))
      .sort((a, b) => b.count - a.count);

    // Leads parados (sem movimentação há mais de 7 dias) — exclui a última etapa (terminal)
    const STALLED_DAYS = 7;
    const cutoff = new Date(Date.now() - STALLED_DAYS * 86_400_000);
    const activeColumns = columns.slice(0, Math.max(columns.length - 1, 0));
    const stalledCount = activeColumns
      .flatMap((col) => col.cards || [])
      .filter((c) => new Date(c.updatedAt) < cutoff).length;

    return {
      pipeline,
      bySource,
      totals: {
        leads: allCards.length,
        value: allCards.reduce((s, c) => s + Number(c.value || 0), 0),
      },
      stalled: { count: stalledCount, days: STALLED_DAYS },
    };
  }
}
