// backend/src/auth/guards/local-auth.guard.ts
import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // По умолчанию AuthGuard('local') вызовет LocalStrategy.
  // Если бы LocalStrategy.validate выбросила исключение (например, UnauthorizedException),
  // то Guard не пропустит запрос и вернет 401 Unauthorized.
  // Если LocalStrategy.validate вернет пользователя, Guard пропустит запрос,
  // и объект пользователя будет добавлен в request.user.
}