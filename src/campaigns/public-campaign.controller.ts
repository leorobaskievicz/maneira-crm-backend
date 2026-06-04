import { Controller, Get, Param, Post, Body } from '@nestjs/common';
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

  @Post(':slug/spin')
  spin(@Param('slug') slug: string, @Body() body: { name: string; phone?: string; email?: string }) {
    return this.service.spin(slug, body);
  }
}
