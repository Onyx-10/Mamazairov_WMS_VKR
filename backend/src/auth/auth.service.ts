import { Injectable } from '@nestjs/common'; // Удален UnauthorizedException, т.к. не используется здесь напрямую
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'; // Импортируем тип User
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'

// Определяем тип для пользователя без хэша пароля, если он еще не определен глобально
type SanitizedUser = Omit<User, 'password_hash'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Валидирует пользователя по имени и паролю.
   * @param username Имя пользователя
   * @param pass Пароль в открытом виде
   * @returns Объект пользователя без хэша пароля, если валидация успешна, иначе null.
   */
  async validateUser(username: string, pass: string): Promise<SanitizedUser | null> {
    const user = await this.usersService.findOneByUsername(username); // этот метод должен возвращать User, включая password_hash

    if (user && user.password_hash && await bcrypt.compare(pass, user.password_hash)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user; // Исключаем хэш пароля
      return result as SanitizedUser; // Приводим к типу SanitizedUser
    }
    return null;
  }

  /**
   * Генерирует JWT для пользователя.
   * @param user Объект пользователя (уже без хэша пароля), который был валидирован.
   *             Ожидается, что 'user' содержит как минимум 'id', 'username' и 'role'.
   * @returns Объект с access_token.
   */
  async login(user: SanitizedUser) { // Используем SanitizedUser для большей ясности
    const payload = {
      username: user.username,
      sub: user.id, // 'sub' (subject) это стандартное поле для ID пользователя в JWT
      role: user.role,  // Включаем роль в токен для последующей авторизации
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}