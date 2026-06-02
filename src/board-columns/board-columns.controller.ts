import { Controller, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BoardColumnsService } from './board-columns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BoardColumn } from './board-column.entity';

@ApiTags('board-columns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('board-columns')
export class BoardColumnsController {
  constructor(private readonly service: BoardColumnsService) {}
  @Post() create(@Body() body: Partial<BoardColumn>) { return this.service.create(body); }
  @Put('order') updateOrder(@Body() body: { columns: { id: string; order: number }[] }) { return this.service.updateOrder(body.columns); }
  @Put(':id') update(@Param('id') id: string, @Body() body: Partial<BoardColumn>) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
