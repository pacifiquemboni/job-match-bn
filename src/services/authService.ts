// src/services/authService.ts
import bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import prisma from '../config/database';
import { RegisterBody, LoginBody, JWTPayload } from '../types';
import logger from '../utils/logger';
import { UserRole } from '@prisma/client';

export class AuthService {
  async register(data: RegisterBody) {
    const { email, password, role, skills, bio } = data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        ...(role === 'WORKER' && {
          workerProfile: {
            create: {
              skills: skills || [],
              bio: bio || null,
            },
          },
        }),
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async login(data: LoginBody) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        workerProfile: true,
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  private generateToken(id: string, email: string, role: UserRole) {
    const payload: JWTPayload = { id, email, role };
    const secret: Secret = process.env.JWT_SECRET || 'default-secret-key';
    const expiresIn: jwt.SignOptions['expiresIn'] =
      (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d';
    return jwt.sign(payload, secret, {
      expiresIn,
    });
  }
}