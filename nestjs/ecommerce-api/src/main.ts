import './env.js';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ObserveInstrument } from './observe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { instrument: ObserveInstrument });
  // Validates every @Body({ schema }), @Query({ schema }) and @Param(..., { schema }).
  app.useGlobalPipes(new StandardSchemaValidationPipe());

  const port = Number(process.env.PORT ?? 3101);
  await app.listen(port);
  console.log(`nest ecommerce-api listening on http://localhost:${port}`);
}
await bootstrap();
