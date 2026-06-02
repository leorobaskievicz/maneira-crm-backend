import { Controller, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Card } from './card.entity';

@ApiTags('cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private readonly service: CardsService) {}
  @Post() create(@Body() body: Partial<Card>) { return this.service.create(body); }
  @Put(':id/move') move(@Param('id') id: string, @Body() body: { columnId: string; order: number; otherCards: { id: string; order: number }[] }) { 
    return this.service.updateOrderAndColumn(id, body.columnId, body.order, body.otherCards); 
  }
  @Put(':id') update(@Param('id') id: string, @Body() body: Partial<Card>) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
