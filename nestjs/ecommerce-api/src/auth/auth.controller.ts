import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { type AuthUser, AuthGuard } from './auth.guards.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';

// No role field: Zod drops unknown keys, so nobody can register themselves as ADMIN.
const registerBody = z.object({
  email: z.email().toLowerCase(),
  // bcrypt only looks at the first 72 bytes of a password.
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(100),
});

const loginBody = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body({ schema: registerBody }) body: z.infer<typeof registerBody>) {
    return this.auth.register(body.email, body.password, body.name);
  }

  // Logging in doesn't create anything, so 200 rather than POST's default 201.
  @Post('login')
  @HttpCode(200)
  login(@Body({ schema: loginBody }) body: z.infer<typeof loginBody>) {
    return this.auth.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
