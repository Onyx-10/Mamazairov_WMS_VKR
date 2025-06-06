// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'; // Для чтения секрета из .env
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { UsersModule } from '../users/users.module'; // Импортируем UsersModule
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
@Module({
  imports: [
    UsersModule, // Чтобы AuthService мог внедрять UsersService
    PassportModule.register({ defaultStrategy: 'jwt' }), // Регистрация Passport
    JwtModule.registerAsync({
      imports: [ConfigModule], // Импортируем ConfigModule для доступа к ConfigService
      inject: [ConfigService],  // Внедряем ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Берем секрет из .env
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'), // Время жизни токена из .env
        },
      }),
    }),
    ConfigModule, // Убедись, что ConfigModule доступен (он должен быть импортирован в AppModule глобально)
  ],
  controllers: [AuthController], // Мы создадим AuthController позже
  providers: [AuthService, JwtStrategy], // AuthService и JwtStrategy будут созданы позже
  exports: [AuthService, JwtModule], // Экспортируем AuthService и JwtModule, если понадобятся где-то еще
})
export class AuthModule {}