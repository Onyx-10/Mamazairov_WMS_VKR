// backend/src/auth/auth.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'; // Мы создадим этот DTO
import { LocalAuthGuard } from './guards/local-auth.guard'; // Мы создадим этот Guard позже

@Controller('auth') // Префикс для всех роутов этого контроллера будет /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Эндпоинт для логина
  // LocalAuthGuard будет использовать LocalStrategy (которую мы создадим) для проверки username/password
  @UseGuards(LocalAuthGuard) // Защищаем этот роут с помощью LocalAuthGuard
  @Post('login')
  @HttpCode(HttpStatus.OK) // Устанавливаем успешный статус 200 OK для логина
  async login(@Request() req, @Body() loginDto: LoginDto) { // @Body() здесь для того, чтобы Swagger/OpenAPI видел DTO, но валидация идет через LocalAuthGuard
    // Если LocalAuthGuard пропустил, значит req.user содержит объект пользователя
    return this.authService.login(req.user); // req.user устанавливается LocalStrategy после успешной валидации
  }

  // Опциональный эндпоинт для регистрации (если мы не хотим использовать POST /users)
  // @Post('register')
  // async register(@Body() createUserDto: CreateUserDto) {
  //   // Валидация createUserDto будет выполнена глобальным ValidationPipe
  //   return this.authService.register(createUserDto);
  // }
}