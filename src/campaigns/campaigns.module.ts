import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './campaign.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { PublicCampaignController } from './public-campaign.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign])],
  providers: [CampaignsService],
  controllers: [CampaignsController, PublicCampaignController],
  exports: [CampaignsService],
})
export class CampaignsModule {}
