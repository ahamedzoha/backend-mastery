/** Throw this from any handler to send a specific status and error code. */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string = code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
