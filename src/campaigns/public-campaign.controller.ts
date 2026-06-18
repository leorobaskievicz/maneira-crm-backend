import { Controller, Get, Param, Post, Body, Query, Res, Header } from '@nestjs/common';
import type { Response } from 'express';
import { CampaignsService } from './campaigns.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('public')
@Controller('public/campaigns')
export class PublicCampaignController {
  constructor(private readonly service: CampaignsService) {}

  // Proxy de imagem para a arte de Stories (declarado antes de ':slug' para não colidir na rota).
  @Get('asset')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Cache-Control', 'public, max-age=86400')
  async asset(@Query('u') url: string, @Res() res: Response) {
    const { buffer, contentType } = await this.service.fetchAsset(url);
    res.setHeader('Content-Type', contentType);
    res.send(buffer);
  }

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

  @Post(':slug/quiz')
  quiz(
    @Param('slug') slug: string,
    @Body() body: { name: string; phone?: string; email?: string; instagram?: string; answers: number[] },
  ) {
    return this.service.submitQuiz(slug, body);
  }
}
