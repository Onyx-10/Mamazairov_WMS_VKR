// backend/src/outbound-shipments/dto/update-outbound-shipment-item.dto.ts
import { PartialType } from '@nestjs/mapped-types'; // Убедись, что @nestjs/mapped-types установлен
import { IsInt, IsOptional, Min } from 'class-validator'
import { AddOutboundShipmentItemDto } from './add-outbound-shipment-item.dto'
// import { ApiProperty } from '@nestjs/swagger';

export class UpdateOutboundShipmentItemDto extends PartialType(
  AddOutboundShipmentItemDto, // Наследует все поля из AddOutboundShipmentItemDto как опциональные
) {
  // Если нужно добавить специфичные поля для обновления, которых нет в Add DTO,
  // или переопределить валидаторы, это делается здесь.

  // Например, quantity_shipped можно было бы обновлять на этом этапе, если идет частичная комплектация
  // @ApiProperty({ example: 3, description: 'Actually prepared/shipped quantity (if partial update)', minimum: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity_shipped?: number; // Это поле будет актуально при фактической обработке отгрузки, но может обновляться и до
}