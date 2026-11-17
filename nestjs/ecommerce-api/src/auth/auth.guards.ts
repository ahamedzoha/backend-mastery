import { z } from 'zod';
import { Role } from '../users/user.entity.js';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { AppException } from '../common/app.exception.js';

export type AuthUser = { id: number; role: Role };
export type AuthRequest = Request & { user?: AuthUser };

// What we expect inside a token we signed. Checked on every request, like any other input.
const tokenPayload = z.object({
  sub: z.coerce.number().int().positive(),
  role: z.enum(Role),
});

/** 401 unless the request has a valid `Authorization: Bearer <token>` header. Sets req.user. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const header = req.get('authorization');
    const token = header?.startsWith('Bearer ')
      ? header.slice('Bearer '.length)
      : undefined;

    if (!token) {
      throw new AppException(401, 'UNAUTHENTICATED', 'Missing bearer token');
    }
    try {
      const payload = tokenPayload.parse(this.jwt.verify(token));
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      throw new AppException(
        401,
        'INVALID_TOKEN',
        'Token is invalid or expired',
      );
    }
    return true;
  }
}

/** 403 unless the logged-in user is an admin. List it after AuthGuard. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    if (req.user?.role !== Role.ADMIN) {
      throw new AppException(403, 'FORBIDDEN', 'Admins only');
    }
    return true;
  }
}
