// backend/src/storage-cells/storage-cells.module.ts
import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'; // <--- ИМПОРТИРУЙ
import { StorageCellsController } from './storage-cells.controller'
import { StorageCellsService } from './storage-cells.service'

@Module({
  imports: [PrismaModule], // <--- ДОБАВЬ СЮДА
  controllers: [StorageCellsController],
  providers: [StorageCellsService],
  exports: [StorageCellsService] // Экспортируй сервис, если он понадобится в других модулях
})
export class StorageCellsModule {}
