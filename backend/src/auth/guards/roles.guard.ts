import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@prisma/client'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Получаем требуемые роли из метаданных, установленных декоратором @Roles()
    //    Декоратор @Roles() может быть применен как к методу обработчика, так и к классу контроллера.
    //    Reflector.getAllAndOverride() сначала ищет метаданные на уровне метода, потом на уровне класса.
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), // Ссылка на метод обработчика
      context.getClass(),   // Ссылка на класс контроллера
    ]);

    // 2. Если для эндпоинта не указаны роли (@Roles() не использовался),
    //    то доступ разрешен (Guard не блокирует).
    //    Если нужна строгая политика "запрещено, если не разрешено явно", здесь можно вернуть false.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Получаем объект пользователя из запроса.
    //    Предполагается, что JwtAuthGuard уже отработал и поместил пользователя в request.user.
    //    Объект user должен содержать поле 'role'.
    const { user } = context.switchToHttp().getRequest();

    // 4. Если пользователя нет в запросе (например, JwtAuthGuard не использовался или не сработал),
    //    или у пользователя нет роли, то доступ запрещен.
    if (!user || !user.role) {
      return false;
    }

    // 5. Проверяем, есть ли у пользователя хотя бы одна из требуемых ролей.
    //    Метод some() вернет true, если хотя бы для одной requiredRole условие user.role === requiredRole будет истинным.
    return requiredRoles.some((role) => user.role === role);
  }
}