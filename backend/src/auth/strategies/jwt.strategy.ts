import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { UserRole } from '@prisma/client'; // Импортируем UserRole, если она есть в JwtPayload
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from '../../users/users.service'; // Убедись, что путь к UsersService правильный

// Определяем интерфейс для JWT Payload
export interface JwtPayload {
  username: string;
  sub: string; // ID пользователя
  role: UserRole; // Роль пользователя
  // Можно добавить iat (issued at) и exp (expiration time), если они нужны для явной проверки
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      // Это критическая ошибка конфигурации, приложение не должно запускаться без секрета
      throw new InternalServerErrorException(
        'JWT_SECRET is not defined in the environment variables.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // Теперь jwtSecret точно string
    });
  }

  /**
   * Метод валидации. Passport вызывает его после успешной проверки подписи токена и срока его действия.
   * @param payload Расшифрованная полезная нагрузка из JWT.
   * @returns Объект, который будет добавлен в request.user, или выбрасывает UnauthorizedException.
   */
  async validate(payload: JwtPayload): Promise<any> {
    // В payload у нас есть sub (id пользователя), username, role.
    // На этом этапе токен уже считается валидным.

    // Получаем актуального пользователя из БД по ID из токена
    const user = await this.usersService.findOneById(payload.sub);

    if (!user) { // findOneById вернет null, если пользователь не найден
      throw new UnauthorizedException('User from token not found.');
    }

    if (!user.is_active) { // Дополнительная проверка, активен ли пользователь
      throw new UnauthorizedException('User is not active.');
    }

    // Возвращаем объект, который будет доступен как request.user в защищенных роутах
    // Важно не возвращать чувствительные данные, такие как хэш пароля.
    // UsersService.findOneById уже должен возвращать пользователя без хэша пароля.
    return {
      id: user.id, // или payload.sub, если findOneById возвращает более полный объект
      username: user.username, // или payload.username
      role: user.role, // или payload.role
      is_active: user.is_active,
      // ... другие поля пользователя, которые могут быть полезны, кроме пароля
    };
  }
}