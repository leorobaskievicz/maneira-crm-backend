import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialRecord } from './financial-record.entity';
import { FinancialRecordsService } from './financial.service';
import { FinancialController } from './financial.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialRecord])],
  providers: [FinancialRecordsService],
  controllers: [FinancialController],
  exports: [FinancialRecordsService],
})
export class FinancialModule {}
