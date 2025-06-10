import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'; // Импорт из 'passport-local'
import { AuthService } from '../auth.service'; // Убедись, что путь правильный

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) { // Передаем Strategy из passport-local
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username', // Имя поля для username в теле запроса (по умолчанию 'username')
      // passwordField: 'password' // Имя поля для password (по умолчанию 'password')
    });
  }

  // Passport автоматически вызовет этот метод с 'username' и 'password' из тела запроса
  // благодаря конфигурации в super() и использованию LocalAuthGuard.
  async validate(username: string, password: string): Promise<any> {
    console.log(`LocalStrategy: Validating user ${username}`); // Для отладки
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      console.log(`LocalStrategy: User ${username} validation failed`); // Для отладки
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log(`LocalStrategy: User ${username} validated successfully`); // Для отладки
    // Если пользователь валиден, Passport поместит возвращаемый объект (здесь 'user')
    // в request.user для последующего использования в контроллере.
    // 'user' здесь - это объект пользователя без хэша пароля, как его возвращает authService.validateUser
    return user;
  }
}