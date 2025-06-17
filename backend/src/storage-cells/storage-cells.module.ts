import { Module } from '@nestjs/common';
import { StorageCellsService } from './storage-cells.service';
import { StorageCellsController } from './storage-cells.controller';

@Module({
  providers: [StorageCellsService],
  controllers: [StorageCellsController]
})
export class StorageCellsModule {}
