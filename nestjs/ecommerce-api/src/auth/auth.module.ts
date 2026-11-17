import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity.js';
import { AuthController } from './auth.controller.js';
import { AdminGuard, AuthGuard } from './auth.guards.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    // registerAsync runs the factory at startup, after .env is loaded, and fails fast without a secret.
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET is not set');
        return {
          secret,
          signOptions: { expiresIn: '1h' },
          verifyOptions: { algorithms: ['HS256'] },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AdminGuard],
  // Modules that import AuthModule can put AuthGuard on their routes (it needs JwtService).
  exports: [AuthGuard, AdminGuard, JwtModule],
})
export class AuthModule {}
