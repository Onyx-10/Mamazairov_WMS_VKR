import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { InboundShipmentsController } from './inbound-shipments.controller'
import { InboundShipmentsService } from './inbound-shipments.service'

@Module({
  imports: [PrismaModule],
  controllers: [InboundShipmentsController],
  providers: [InboundShipmentsService],
})
export class InboundShipmentsModule {}