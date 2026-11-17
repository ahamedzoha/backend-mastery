import './env.js';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ObserveInstrument } from './observe.js';
import { ValidationException } from './common/validation.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  // Validates every @Body({ schema }), @Query({ schema }) and @Param(..., { schema }).
  // The factory keeps Zod's issues, so the 400 body matches Express ({ code, details }).
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      exceptionFactory: (issues) => new ValidationException(issues),
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.PORT ?? 3101);
  await app.listen(port);
  console.log(`nest ecommerce-api listening on http://localhost:${port}`);
}
await bootstrap();
