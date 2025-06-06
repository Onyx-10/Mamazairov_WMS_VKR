// backend/src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'; // <--- Импортируй
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'; // <--- CLI должен был добавить это, когда ты генерировал auth module
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ // <--- Сконфигурируй глобально
      isGlobal: true, // Делает ConfigModule доступным во всем приложении без импорта в каждом модуле
      envFilePath: '.env', // Указывает на наш .env файл
    }),
    PrismaModule, // <--- Добавь PrismaModule сюда 
    UsersModule,
    AuthModule, // <--- Убедись, что AuthModule здесь есть
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
