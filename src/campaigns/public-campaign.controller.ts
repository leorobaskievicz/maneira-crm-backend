import { Controller, Get, Param, Post } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('public')
@Controller('public/campaigns')
export class PublicCampaignController {
  constructor(private readonly service: CampaignsService) {}

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    await this.service.trackView(slug);
    return this.service.findBySlug(slug);
  }

  @Post(':slug/click')
  trackClick(@Param('slug') slug: string) {
    return this.service.trackClick(slug);
  }
}
