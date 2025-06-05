import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Global() // Делает этот модуль глобальным
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Экспортируем PrismaService, чтобы он был доступен для DI
})
export class PrismaModule {}