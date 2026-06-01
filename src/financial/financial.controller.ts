import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { FinancialRecordsService } from './financial.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('financial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financial')
export class FinancialController {
  constructor(private readonly service: FinancialRecordsService) {}

  @Get()
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(@Query('startDate') start?: string, @Query('endDate') end?: string) {
    return this.service.findAll(start, end);
  }

  @Get('summary')
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  summary(@Query('year') year?: string, @Query('month') month?: string) {
    const now = new Date();
    return this.service.summary(+(year || now.getFullYear()), +(month || now.getMonth() + 1));
  }

  @Post()
  create(@Body() body: any) { return this.service.create(body); }
}
