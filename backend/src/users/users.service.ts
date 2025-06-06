import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { Prisma, User } from '@prisma/client'; // Импортируем типы Prisma
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'; // Убедись, что путь к PrismaService правильный
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password_hash'>> {
    const { username, password, full_name, role, is_active } = createUserDto;

    // Проверка, существует ли пользователь с таким username
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Хэширование пароля
    const saltRounds = 10; // Рекомендуемое количество раундов для bcrypt
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new InternalServerErrorException('Failed to hash password');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          password_hash: hashedPassword,
          full_name,
          role: role, // Prisma enum UserRole будет использован автоматически
          is_active: is_active,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user; // Исключаем хэш пароля из ответа
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Обработка специфических ошибок Prisma, если нужно
        if (error.code === 'P2002') { // Уникальное ограничение нарушено (маловероятно здесь, если username проверен)
          throw new ConflictException('Error creating user due to constraint violation.');
        }
      }
      throw new InternalServerErrorException('Could not create user.');
    }
  }

  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    const users = await this.prisma.user.findMany();
    return users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user;
      return result;
    });
  }

  async findOne(id: string): Promise<Omit<User, 'password_hash'> | null> { // <--- id теперь string
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...result } = user;
    return result;
  }

  // Дополнительный метод для поиска по username (понадобится для аутентификации)
  async findOneByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password_hash'>> { // <--- id теперь string
    const { password, ...dataToUpdate } = updateUserDto;

    if (password) {
      const saltRounds = 10;
      try {
         (dataToUpdate as any).password_hash = await bcrypt.hash(password, saltRounds);
      } catch (error) {
         throw new InternalServerErrorException('Failed to hash new password');
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException(`Username already exists (when trying to update username).`);
      }
      throw new InternalServerErrorException('Could not update user.');
    }
  }

  async remove(id: string): Promise<Omit<User, 'password_hash'>> { // <--- id теперь string
    try {
      const user = await this.prisma.user.delete({
        where: { id },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }
      throw new InternalServerErrorException('Could not delete user.');
    }
  }
}
