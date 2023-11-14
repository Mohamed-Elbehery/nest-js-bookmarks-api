import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //TODO@ enable using global pipes through the whole app for the dto (Data Transfer Object)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }));
  await app.listen(3333);
}

bootstrap();