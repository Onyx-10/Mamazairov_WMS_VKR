import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'; // <--- ИМПОРТ PrismaModule
import { SearchController } from './search.controller'
import { SearchService } from './search.service'

@Module({
  imports: [PrismaModule], // <--- ДОБАВЬ PrismaModule в imports
  providers: [SearchService],
  controllers: [SearchController],
  // exports: [SearchService] // Экспортировать сервис обычно не нужно, если он используется только внутри этого модуля
})
export class SearchModule {}