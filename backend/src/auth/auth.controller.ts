// backend/src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get, // Для DTO и Swagger
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // <--- ИМПОРТИРУЙ JwtAuthGuard
import { LocalAuthGuard } from './guards/local-auth.guard'

// Для Swagger (опционально)
// import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// @ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // --- Эндпоинт для входа пользователя ---
  // @ApiOperation({ summary: 'Log in a user and get a JWT' })
  // @ApiBody({ type: LoginDto })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Login successful, returns JWT token.'})
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials.'})
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req, @Body() loginDto: LoginDto) {
    // req.user здесь содержит пользователя, возвращенного LocalStrategy.validate()
    console.log('AuthController: User in request after LocalAuthGuard (login):', req.user); // Для отладки
    return this.authService.login(req.user);
  }

  // --- Эндпоинт для получения профиля текущего аутентифицированного пользователя ---
  // @ApiOperation({ summary: 'Get current user profile' })
  // @ApiBearerAuth() // Указывает Swagger, что этот эндпоинт требует Bearer токен
  // @ApiResponse({ status: HttpStatus.OK, description: 'Current user profile data.'})
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized (token missing or invalid).'})
  @UseGuards(JwtAuthGuard) // <--- ЗАЩИЩАЕМ ЭТОТ РОУТ с помощью JwtAuthGuard
  @Get('profile')
  getProfile(@Request() req) {
    // Если JwtAuthGuard пропустил запрос, это означает, что JwtStrategy.validate()
    // успешно вернула данные (например, объект пользователя), и они теперь в req.user.
    console.log('AuthController: User in request after JwtAuthGuard (profile):', req.user); // Для отладки
    return req.user; // req.user здесь содержит то, что вернула JwtStrategy.validate()
  }
}