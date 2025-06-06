import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'; // <--- Убедись, что путь правильный
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [PrismaModule], // <--- Добавь PrismaModule
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // <--- Добавь UsersService в exports
})
export class UsersModule {}