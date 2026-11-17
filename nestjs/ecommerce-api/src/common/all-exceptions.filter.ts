import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppException } from './app.exception.js';
import { ValidationException } from './validation.js';

// Postgres error codes worth turning into a client error instead of a 500.
const pgErrors: Record<
  string,
  { status: number; code: string; message: string }
> = {
  '23505': {
    status: 409,
    code: 'ALREADY_EXISTS',
    message: 'A record with that value already exists',
  },
  '23503': {
    status: 409,
    code: 'CONFLICT',
    message: 'A related record is missing or still in use',
  },
};

// Catches everything, so every error has the Express shape: { error: { code, message } }.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errors');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const send = (status: number, error: object) =>
      res.status(status).json({ error });

    if (exception instanceof ValidationException) {
      return send(400, { code: 'VALIDATION', details: exception.issues });
    }
    if (exception instanceof AppException) {
      return send(exception.getStatus(), {
        code: exception.code,
        message: exception.message,
      });
    }
    if (exception instanceof HttpException) {
      // Nest's own errors, e.g. the 404 for an unknown route.
      const status = exception.getStatus();
      return send(status, {
        code: HttpStatus[status] ?? 'ERROR',
        message: exception.message,
      });
    }
    if (exception instanceof QueryFailedError) {
      const pg = pgErrors[(exception.driverError as { code?: string }).code!];
      if (pg) return send(pg.status, { code: pg.code, message: pg.message });
    }
    this.logger.error(exception);
    return send(500, { code: 'INTERNAL', message: 'Something went wrong' });
  }
}
