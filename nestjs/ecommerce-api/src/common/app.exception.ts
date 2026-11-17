import { HttpException } from '@nestjs/common';

/** Throw this from anywhere to send a specific status and error code (Express's AppError). */
export class AppException extends HttpException {
  constructor(
    status: number,
    readonly code: string,
    message: string = code,
  ) {
    super(message, status);
  }
}
