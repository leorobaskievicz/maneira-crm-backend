import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from './campaign.entity';
import { CampaignEntry } from './campaign-entry.entity';
import { Board } from '../boards/board.entity';
import { Card } from '../cards/card.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { PublicCampaignController } from './public-campaign.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, CampaignEntry, Board, Card])],
  providers: [CampaignsService],
  controllers: [CampaignsController, PublicCampaignController],
  exports: [CampaignsService],
})
export class CampaignsModule {}
