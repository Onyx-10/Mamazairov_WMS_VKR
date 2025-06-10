// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'; // <--- Убедись, что импортирована

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }), // Можно оставить 'jwt' или убрать defaultStrategy, если не нужно
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
    ConfigModule, // Если ConfigModule глобальный, этот импорт здесь может быть не нужен, но не повредит
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy, // <--- Убедись, что LocalStrategy здесь зарегистрирована
  ],
  exports: [AuthService, JwtModule], // Экспорт JwtModule важен для JwtAuthGuard в других модулях
})
export class AuthModule {}