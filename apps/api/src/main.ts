import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import type { Request } from 'express';
import { AppModule } from './app.module';

type RawBodyRequest = Request & {
  rawBody?: Buffer;
};

function saveRawBody(request: RawBodyRequest, _: unknown, buffer: Buffer) {
  if (buffer.length) {
    request.rawBody = Buffer.from(buffer);
  }
}

function getAllowedOrigins() {
  const rawOrigins = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.use(
    json({
      limit: '1mb',
      verify: saveRawBody,
    }),
  );
  app.use(
    urlencoded({
      extended: true,
      limit: '1mb',
      verify: saveRawBody,
    }),
  );

  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
