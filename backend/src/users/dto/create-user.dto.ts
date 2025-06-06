import { UserRole } from '@prisma/client'; // Импортируем enum из сгенерированного Prisma Client
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string; // В сервисе мы его будем хэшировать

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole; // ? делает поле опциональным, будет использовано @default из Prisma схемы

  @IsOptional()
  @IsBoolean()
  is_active?: boolean; // Также опционально
}