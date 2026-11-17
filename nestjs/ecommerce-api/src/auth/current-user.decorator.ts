import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthRequest, AuthUser } from './auth.guards.js';

/** The user AuthGuard put on the request. Use it only on routes behind AuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthRequest>().user!,
);
