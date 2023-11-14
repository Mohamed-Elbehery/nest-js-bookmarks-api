import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) { }

  async signup(dto: AuthDto) {
    try {
      // generate the password hash
      const hash = await argon.hash(dto.password);

      // save the new user in the db
      const user = await this.prisma.user.create({
        data: { ...dto, password: hash }
      });

      // send back the user
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ForbiddenException("Credentials Taken")
        }
      }

      throw error;
    }
  }

  async signin(dto: AuthDto) {
    // find the user by email
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })

    // if user does not exist throw exception => This is a Guard
    if (!user) throw new ForbiddenException("Credentials incorrect")

    // compare passwords
    const pwMatches = await argon.verify(user.password, dto.password);

    // if password is incorrect throw exception => This is a Guard
    if (!pwMatches) throw new ForbiddenException("Credentials incorrect")

    // send back the user
    return this.signToken(user.id, user.email);
  }

  async signToken(userId: number, email: string): Promise<{ access_token: string; }> {
    // create the payload that will be signed to jwt
    const payload = {
      sub: userId,
      email
    }

    // generate the token
    const token = await this.jwt.signAsync(payload, {
      expiresIn: "15m",
      secret: this.config.get("JWT_SECRET")
    });

    // send the access token back
    return {
      access_token: token,
    }
  }
}
