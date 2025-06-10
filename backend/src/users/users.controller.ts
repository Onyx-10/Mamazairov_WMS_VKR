// backend/src/users/users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get, // Для валидации формата UUID
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param, // Для выбрасывания ошибки, если не найден
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UsersService } from './users.service'
// Если ты захочешь использовать Swagger для документации API:
// import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

// @ApiTags('users') // Группировка эндпоинтов в Swagger UI
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- Создание пользователя ---
  // @ApiOperation({ summary: 'Create a new user' })
  // @ApiResponse({ status: HttpStatus.CREATED, description: 'The user has been successfully created.'})
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
  // @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflict (e.g., username already exists).' })
  // @ApiBody({ type: CreateUserDto })
  @Post()
  @HttpCode(HttpStatus.CREATED) // Явно указываем HTTP статус 201 для создания
  async create(@Body() createUserDto: CreateUserDto) {
    // UsersService.create уже возвращает пользователя без хэша пароля
    // и обрабатывает ConflictException, если username занят.
    return this.usersService.create(createUserDto);
  }

  // --- Получение списка всех пользователей ---
  // @ApiOperation({ summary: 'Get all users' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'List of all users.'})
  @Get()
  async findAll() {
    // UsersService.findAll уже возвращает пользователей без хэшей паролей
    return this.usersService.findAll();
  }

  // --- Получение одного пользователя по ID ---
  // @ApiOperation({ summary: 'Get a user by ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'User found.'})
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.'})
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid ID format.'})
  // @ApiParam({ name: 'id', required: true, description: 'User ID (UUID format)' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    // ParseUUIDPipe проверит, что 'id' - это валидный UUID.
    // Если нет, NestJS автоматически вернет ошибку 400 Bad Request.

    const user = await this.usersService.findOneById(id); // <--- ИСПОЛЬЗУЕМ findOneById
    
    if (!user) {
      // UsersService.findOneById возвращает null, если пользователь не найден.
      // Контроллер выбрасывает NotFoundException.
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user; // user уже без хэша пароля
  }

  // --- Обновление пользователя по ID ---
  // @ApiOperation({ summary: 'Update a user by ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully.'})
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.'})
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request / Invalid ID format.'})
  // @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflict (e.g., new username already taken).' })
  // @ApiParam({ name: 'id', required: true, description: 'User ID (UUID format)' })
  // @ApiBody({ type: UpdateUserDto })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // UsersService.update обрабатывает NotFoundException и ConflictException внутри себя
    // и возвращает обновленного пользователя без хэша пароля.
    return this.usersService.update(id, updateUserDto);
  }

  // --- Удаление пользователя по ID ---
  // @ApiOperation({ summary: 'Delete a user by ID' })
  // @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User deleted successfully.'})
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.'})
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid ID format.'})
  // @ApiParam({ name: 'id', required: true, description: 'User ID (UUID format)' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Стандартный статус 204 для успешного DELETE без возврата тела
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    // UsersService.remove обрабатывает NotFoundException внутри себя.
    // Для статуса 204 (NO_CONTENT) не должно быть тела ответа.
    await this.usersService.remove(id);
    // Ничего не возвращаем явно, NestJS отправит ответ 204 No Content.
  }
}
