// backend/src/main.ts
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- ВКЛЮЧЕНИЕ CORS ---
  app.enableCors({
    origin: 'http://localhost:5173', // Разрешаем запросы от твоего frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Разрешенные HTTP методы
    credentials: true, // Если ты планируешь использовать куки или заголовки авторизации, которые требуют credentials
    // allowedHeaders: 'Content-Type, Accept, Authorization', // Можно явно указать разрешенные заголовки
  });
  // --- КОНЕЦ ВКЛЮЧЕНИЯ CORS ---

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // --- Настройка Swagger (если есть) ---
  // const config = new DocumentBuilder()
  //   .setTitle('Warehouse Management API')
  //   .setDescription('API documentation for the Warehouse Management System (VKR project)')
  //   .setVersion('1.0')
  //   .addBearerAuth() 
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api-docs', app, document);
  // --- Конец настройки Swagger ---

  await app.listen(3000); // Убедись, что порт backend здесь 3000
  console.log(`Application is running on: ${await app.getUrl()}`);
  // if (process.env.NODE_ENV !== 'production') { // Чтобы не показывать в продакшене, если Swagger есть
  //   console.log(`Swagger documentation is available at: ${await app.getUrl()}/api-docs`);
  // }
}
bootstrap();