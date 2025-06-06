import { ValidationPipe } from '@nestjs/common'; // Импортируем ValidationPipe
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Глобальное подключение ValidationPipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Удаляет свойства, которых нет в DTO
    forbidNonWhitelisted: true, // Выдает ошибку, если есть лишние свойства
    transform: true, // Автоматически преобразует payload к типам DTO (например, строку в число, если это возможно)
    transformOptions: {
      enableImplicitConversion: true, // Разрешает неявное преобразование типов
    },
  }));

  await app.listen(3000);
}
bootstrap();
