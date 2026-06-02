import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardColumn } from './board-column.entity';
import { BoardColumnsService } from './board-columns.service';
import { BoardColumnsController } from './board-columns.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BoardColumn])],
  providers: [BoardColumnsService],
  controllers: [BoardColumnsController],
  exports: [BoardColumnsService],
})
export class BoardColumnsModule {}
