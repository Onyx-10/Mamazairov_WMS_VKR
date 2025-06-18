import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'; // <--- ИМПОРТИРУЙ
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

@Module({
  imports: [PrismaModule], // <--- ДОБАВЬ СЮДА
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService] // Если понадобится в других модулях
})
export class ProductsModule {}