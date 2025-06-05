import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'; // Убедись, что Prisma Client сгенерирован

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      // Опционально: логирование запросов Prisma
      // Полезно для отладки, можно раскомментировать нужные уровни
      // log: [
      //   { emit: 'stdout', level: 'query' }, // Покажет SQL запросы
      //   // { emit: 'stdout', level: 'info' },
      //   // { emit: 'stdout', level: 'warn' },
      //   // { emit: 'stdout', level: 'error' },
      // ],
    });
  }

  async onModuleInit() {
    // Этот метод вызывается, когда NestJS инициализирует модуль,
    // в котором зарегистрирован этот сервис.
    // Здесь мы явно подключаемся к базе данных.
    await this.$connect();
    console.log('PrismaService: Successfully connected to the database.'); // Добавим лог для проверки
  }

  async onModuleDestroy() {
    // Этот метод вызывается, когда NestJS уничтожает модуль.
    // Здесь мы явно отключаемся от базы данных.
    await this.$disconnect();
    console.log('PrismaService: Successfully disconnected from the database.'); // Добавим лог
  }
}