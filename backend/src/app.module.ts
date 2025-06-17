import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'; // <--- Импортируй - ЕСТЬ
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'; // <--- CLI должен был добавить это, когда ты генерировал auth module - ЕСТЬ
import { PrismaModule } from './prisma/prisma.module'
import { StorageCellsModule } from './storage-cells/storage-cells.module'; // <--- Добавлен StorageCellsModule - ЕСТЬ
import { UsersModule } from './users/users.module'; // <--- ЕСТЬ

@Module({
  imports: [
    ConfigModule.forRoot({ // <--- Сконфигурируй глобально - ЕСТЬ
      isGlobal: true, // Делает ConfigModule доступным во всем приложении без импорта в каждом модуле - ЕСТЬ
      envFilePath: '.env', // Указывает на наш .env файл - ЕСТЬ
    }),
    PrismaModule, // <--- Добавь PrismaModule сюда - ЕСТЬ
    UsersModule,
    AuthModule,     // <--- Убедись, что AuthModule здесь есть - ЕСТЬ
    StorageCellsModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}