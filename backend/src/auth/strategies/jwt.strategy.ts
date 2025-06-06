import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { User } from '@prisma/client'
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt'; // Убедись, что StrategyOptions импортирован
import { UsersService } from '../../users/users.service'
import { JwtPayload } from '../auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecretFromEnv = configService.get<string>('JWT_SECRET');

    if (!jwtSecretFromEnv) {
      throw new InternalServerErrorException('JWT_SECRET is not defined in environment variables. Application cannot start.');
    }

    // Создаем объект опций с явно заданными типами, где это возможно
    const strategyOptions: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecretFromEnv, // Теперь jwtSecretFromEnv точно string здесь по логике
    };

    super(strategyOptions);
  }

  async validate(payload: JwtPayload): Promise<Omit<User, 'password_hash'>> {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or token is invalid');
    }
    if (!user.is_active) {
      throw new UnauthorizedException('User is inactive');
    }
    return user;
  }
}