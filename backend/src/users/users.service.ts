import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, User, UserRole } from '@prisma/client'; // Добавлен UserRole для явности
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    const { username, password, full_name, role, is_active } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const saltRounds = 10;
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (error) {
      // Логирование ошибки было бы здесь полезно
      throw new InternalServerErrorException('Failed to hash password');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          password_hash: hashedPassword,
          full_name,
          role: role || UserRole.WAREHOUSE_KEEPER, // Используем значение по умолчанию, если роль не передана
          is_active: is_active !== undefined ? is_active : true, // Используем значение по умолчанию
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Error creating user due to constraint violation.',
          );
        }
      }
      // Логирование ошибки было бы здесь полезно
      throw new InternalServerErrorException('Could not create user.');
    }
  }

  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user;
      return result;
    });
  }

  // Метод для поиска пользователя по ID. Используется, например, в JwtStrategy.
  // Возвращает пользователя без хэша пароля или null, если не найден.
  async findOneById(id: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...result } = user;
    return result;
  }

  // Метод для поиска пользователя по username. Используется для аутентификации.
  // Возвращает ПОЛНОГО пользователя (включая password_hash) или null.
  async findOneByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    const { password, ...dataToUpdate } = updateUserDto;

    // Проверяем, существует ли пользователь перед обновлением
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (password) {
      const saltRounds = 10;
      try {
        (dataToUpdate as any).password_hash = await bcrypt.hash(
          password,
          saltRounds,
        );
      } catch (error) {
        // Логирование ошибки
        throw new InternalServerErrorException('Failed to hash new password');
      }
    }

    // Если пытаются обновить username, проверить, не занят ли он другим пользователем
    if (dataToUpdate.username && dataToUpdate.username !== existingUser.username) {
        const userWithNewUsername = await this.prisma.user.findUnique({
            where: { username: dataToUpdate.username },
        });
        if (userWithNewUsername && userWithNewUsername.id !== id) {
            throw new ConflictException(`Username "${dataToUpdate.username}" already taken.`);
        }
    }


    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = updatedUser;
      return result;
    } catch (error) {
      // P2025 - запись для обновления не найдена (уже проверено выше, но на всякий случай)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`User with ID "${id}" not found during update.`);
      }
      // P2002 - нарушение уникального ограничения (например, если username все же пытаются сделать неуникальным)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Update failed due to unique constraint violation (e.g., username already exists).`);
      }
      // Логирование ошибки
      throw new InternalServerErrorException('Could not update user.');
    }
  }

  async remove(id: string): Promise<Omit<User, 'password_hash'>> {
    try {
      const user = await this.prisma.user.delete({
        where: { id },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`User with ID "${id}" not found, cannot delete.`);
      }
      // Логирование ошибки
      throw new InternalServerErrorException('Could not delete user.');
    }
  }
}
