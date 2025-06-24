// backend/src/outbound-shipments/outbound-shipments.module.ts
import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { OutboundShipmentsController } from './outbound-shipments.controller'
import { OutboundShipmentsService } from './outbound-shipments.service'

@Module({
  imports: [PrismaModule],
  controllers: [OutboundShipmentsController],
  providers: [OutboundShipmentsService],
})
export class OutboundShipmentsModule {}