import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AppException } from '../common/app.exception.js';
import { User } from '../users/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  // A taken email hits the unique constraint: 23505, so 409.
  async register(email: string, password: string, name: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    // save() hands back the object it saved, hash included, so strip it.
    const { passwordHash: _, ...user } = await this.users.save(
      this.users.create({ email, passwordHash, name }),
    );
    return { token: this.sign(user), user };
  }

  async login(email: string, password: string) {
    // passwordHash has select: false, so ask for it explicitly.
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
    // Same answer for "no such user" and "wrong password", so the response doesn't reveal which emails exist.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppException(
        401,
        'INVALID_CREDENTIALS',
        'Email or password is incorrect',
      );
    }
    const { passwordHash: _, ...safeUser } = user;
    return { token: this.sign(user), user: safeUser };
  }

  async me(id: number) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new AppException(404, 'NOT_FOUND', 'User not found');
    return user;
  }

  private sign(user: Pick<User, 'id' | 'role'>) {
    return this.jwt.sign({ sub: String(user.id), role: user.role });
  }
}
