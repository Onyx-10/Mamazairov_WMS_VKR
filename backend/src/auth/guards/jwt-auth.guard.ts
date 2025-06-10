import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {} // Используем имя стратегии 'jwt' (по умолчанию для JwtStrategy)