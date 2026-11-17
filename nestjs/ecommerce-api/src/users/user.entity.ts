import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  // select: false leaves the hash out of every query unless one asks for it (Prisma's omit).
  @Column({ select: false })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
  role: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
