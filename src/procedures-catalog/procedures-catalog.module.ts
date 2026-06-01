import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcedureCatalog } from './procedure-catalog.entity';
import { ProcedureCatalogsService } from './procedures-catalog.service';
import { ProcedureCatalogsController } from './procedures-catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProcedureCatalog])],
  providers: [ProcedureCatalogsService],
  controllers: [ProcedureCatalogsController],
  exports: [ProcedureCatalogsService],
})
export class ProceduresCatalogModule {}
