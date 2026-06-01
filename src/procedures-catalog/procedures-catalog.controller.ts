import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProcedureCatalogsService } from './procedures-catalog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProcedureCatalog } from './procedure-catalog.entity';

@ApiTags('procedures-catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('procedures-catalog')
export class ProcedureCatalogsController {
  constructor(private readonly service: ProcedureCatalogsService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() body: Partial<ProcedureCatalog>) { return this.service.create(body); }
  @Put(':id') update(@Param('id') id: string, @Body() body: Partial<ProcedureCatalog>) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
