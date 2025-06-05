
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'; // <--- ДОБАВЬ ЭТОТ ИМПОРТ
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'; // <--- ДОБАВЬ ЭТОТ ИМПОРТ

@Module({
  imports: [
    ConfigModule.forRoot({ // <--- ДОБАВЬ ЭТУ СТРОКУ ДЛЯ ЗАГРУЗКИ .env
      isGlobal: true,      // Делаем ConfigModule доступным глобально
    }),
    PrismaModule,          // <--- ДОБАВЬ PrismaModule СЮДА
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
