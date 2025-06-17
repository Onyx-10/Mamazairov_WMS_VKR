// backend/src/users/users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards, // <--- Важно для применения Guards
} from '@nestjs/common'
import { UserRole } from '@prisma/client'; // <--- Импорт UserRole enum
import { Roles } from '../auth/decorators/roles.decorator'; // <--- Импорт Roles декоратора
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // <--- Импорт JwtAuthGuard
import { RolesGuard } from '../auth/guards/roles.guard'; // <--- Импорт RolesGuard
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UsersService } from './users.service'

// Если ты захочешь использовать Swagger для документации API:
// import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

// @ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- Создание пользователя (ВРЕМЕННО ПУБЛИЧНЫЙ для создания первого менеджера) ---
  // @ApiOperation({ summary: 'Create a new user (MANAGER only)' })
  // @ApiBearerAuth() // Указывает, что нужен JWT
  // @ApiResponse({ status: HttpStatus.CREATED, description: 'The user has been successfully created.'})
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request.' })
  // @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflict (e.g., username already exists).' })
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.'}) // Закомментировано, т.к. Guard ниже тоже
  // @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden (user does not have MANAGER role).'}) // Закомментировано
  // @ApiBody({ type: CreateUserDto })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)             
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // --- Получение списка всех пользователей (только для MANAGER) ---
  // @ApiOperation({ summary: 'Get all users (MANAGER only)' })
  // @ApiBearerAuth()
  // @ApiResponse({ status: HttpStatus.OK, description: 'List of all users.'})
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.'})
  // @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden (user does not have MANAGER role).'})
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  async findAll() {
    return this.usersService.findAll();
  }

  // --- Получение одного пользователя по ID (только для MANAGER) ---
  // @ApiOperation({ summary: 'Get a user by ID (MANAGER only)' })
  // @ApiBearerAuth()
  // @ApiResponse({ status: HttpStatus.OK, description: 'User found.'})
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.'})
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid ID format.'})
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.'})
  // @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden (user does not have MANAGER role).'})
  // @ApiParam({ name: 'id', required: true, description: 'User ID (UUID format)' })
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  // --- Обновление пользователя по ID (только для MANAGER) ---
  // @ApiOperation({ summary: 'Update a user by ID (MANAGER only)' })
  // @ApiBearerAuth()
  // @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully.'})
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.'})
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request / Invalid ID format.'})
  // @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Conflict (e.g., new username already taken).' })
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.'})
  // @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden (user does not have MANAGER role).'})
  // @ApiParam({ name: 'id', required: true, description: 'User ID (UUID format)' })
  // @ApiBody({ type: UpdateUserDto })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  // --- Удаление пользователя по ID (только для MANAGER) ---
  // @ApiOperation({ summary: 'Delete a user by ID (MANAGER only)' })
  // @ApiBearerAuth()
  // @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User deleted successfully.'})
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.'})
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid ID format.'})
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.'})
  // @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden (user does not have MANAGER role).'})
  // @ApiParam({ name: 'id', required: true, description: 'User ID (UUID format)' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);
  }
}