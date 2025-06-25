import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { InboundShipmentsModule } from './inbound-shipments/inbound-shipments.module'
import { OutboundShipmentsModule } from './outbound-shipments/outbound-shipments.module'
import { PrismaModule } from './prisma/prisma.module'
import { ProductsModule } from './products/products.module'
import { SearchModule } from './search/search.module'; // <--- ИМПОРТ SearchModule
import { StorageCellsModule } from './storage-cells/storage-cells.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    StorageCellsModule,
    ProductsModule,
    InboundShipmentsModule, // Если он уже есть
    OutboundShipmentsModule, // Если он уже есть
    SearchModule,         // <--- ДОБАВЬ SearchModule сюда
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}