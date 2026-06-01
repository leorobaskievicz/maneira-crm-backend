import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { FinancialRecord } from '../financial/financial-record.entity';
import { Patient } from '../patients/patient.entity';
import { Product } from '../products/product.entity';
import { Lead } from '../leads/lead.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, FinancialRecord, Patient, Product, Lead])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
