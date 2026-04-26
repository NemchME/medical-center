import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@medicina/shared';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    birthDate?: string;
    role?: UserRole;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email уже зарегистрирован');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const roleName = dto.role ?? UserRole.PATIENT;

    const role = await this.prisma.role.upsert({
      where: { name: roleName },
      create: { name: roleName },
      update: {},
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        profile: {
          create: {
            phone: dto.phone,
            birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          },
        },
        roles: {
          create: { roleId: role.id },
        },
      },
    });

    if (roleName === UserRole.PATIENT) {
      await this.prisma.patient.create({
        data: {
          userId: user.id,
          fullName: dto.fullName,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          phone: dto.phone,
          email: dto.email,
        },
      });
    }

    return this.buildAuthResponse(user.id);
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Неверный email или пароль');
    if (!user.isActive) throw new UnauthorizedException('Аккаунт деактивирован');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Неверный email или пароль');

    return this.buildAuthResponse(user.id);
  }

  private async buildAuthResponse(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new UnauthorizedException();

    const roles = user.roles.map((ur: { role: { name: string } }) => ur.role.name);
    const payload = { sub: Number(user.id), email: user.email, roles };

    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: Number(user.id),
        email: user.email,
        fullName: user.fullName,
        roles,
      },
    };
  }
}
