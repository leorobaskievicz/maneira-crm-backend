import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({ origin: '*' });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Maneira CRM')
    .setDescription('API do sistema de gestão para clínica de estética')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Garantir pasta de uploads
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Maneira CRM Backend rodando na porta ${port}`);
  console.log(`📖 Swagger: http://localhost:${port}/docs`);
}
bootstrap();
