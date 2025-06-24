import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'; // <--- Импортируй
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'; // <--- CLI должен был добавить это, когда ты генерировал auth module - ЕСТЬ
import { InboundShipmentsModule } from './inbound-shipments/inbound-shipments.module'
import { OutboundShipmentsModule } from './outbound-shipments/outbound-shipments.module'
import { PrismaModule } from './prisma/prisma.module'
import { ProductsModule } from './products/products.module'
import { StorageCellsModule } from './storage-cells/storage-cells.module'; // <--- Добавлен StorageCellsModule
import { UsersModule } from './users/users.module'; // <--- ЕСТЬ

@Module({
  imports: [
    ConfigModule.forRoot({ // <--- Сконфигурируй глобально 
      isGlobal: true, // Делает ConfigModule доступным во всем приложении без импорта в каждом модуле
      envFilePath: '.env', // Указывает на наш .env файл 
    }),
    PrismaModule, // <--- Добавь PrismaModule сюда 
    UsersModule,
    AuthModule,     // <--- Убедись, что AuthModule здесь есть 
    StorageCellsModule, 
    ProductsModule, 
    InboundShipmentsModule, 
    OutboundShipmentsModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}