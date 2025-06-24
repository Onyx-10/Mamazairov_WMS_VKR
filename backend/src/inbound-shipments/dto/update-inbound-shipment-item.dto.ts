// backend/src/inbound-shipments/dto/update-inbound-shipment-item.dto.ts
import { PartialType } from '@nestjs/mapped-types'
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator'
import { AddInboundShipmentItemDto } from './add-inbound-shipment-item.dto'
// import { ApiProperty } from '@nestjs/swagger';

// Наследуем от AddInboundShipmentItemDto, но product_id не должен меняться в существующей позиции
// Если нужно менять продукт, то это удаление старой позиции и добавление новой.
export class UpdateInboundShipmentItemDto extends PartialType(AddInboundShipmentItemDto) {
  // Поля из AddInboundShipmentItemDto будут опциональными.
  // Дополнительно можно добавить поле для указания ячейки, если это делается на этапе обновления позиции.

  // @ApiProperty({ example: 'uuid-of-storage-cell', description: 'ID of the target storage cell (UUID)', required: false })
  @IsOptional()
  @IsUUID()
  target_storage_cell_id?: string;

  // Переопределяем quantity_received, чтобы оно точно было в Update DTO, если его нужно обновить
  // @ApiProperty({ example: 10, description: 'Actually received quantity', minimum: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity_received?: number;
}