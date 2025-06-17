import { SetMetadata } from '@nestjs/common'
import { UserRole } from '@prisma/client'; // Импортируем наш enum UserRole

export const ROLES_KEY = 'roles'; // Ключ, по которому метаданные будут храниться и извлекаться
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);