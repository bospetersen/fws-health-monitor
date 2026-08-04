import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const showSwagger = process.env.SHOW_SWAGGER_UI === 'true';
  const config = new DocumentBuilder()
    .setTitle('FWS Health Monitor API')
    .setDescription('Independent health monitoring service for FWS infrastructure')
    .setVersion('1.0')
    .addTag('Health Check', 'Health check operations')
    .addTag('Endpoints', 'Monitored endpoints management')
    .addTag('Intervals', 'Check interval configuration')
    .addTag('Status', 'Service status')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerUrl: 'api/swagger-ui.json',
    ui: showSwagger,
  });

  const port = process.env.PORT || 3400;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Health Monitor Service running on http://0.0.0.0:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap();
