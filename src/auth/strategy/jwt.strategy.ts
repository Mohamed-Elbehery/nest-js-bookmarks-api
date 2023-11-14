import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from '@nestjs/config';

import { ExtractJwt, Strategy } from "passport-jwt";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreException: false,
      secretOrKey: config.get("JWT_SECRET"),
    })
  }

  async validate(payload: {
    sub: number
    email: string
  }): Promise<{
    id: number;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub
      }
    })

    delete user.password;
    return user;
  }
}