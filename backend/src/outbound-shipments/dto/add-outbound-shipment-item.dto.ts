import {
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsUUID,
	Min,
} from 'class-validator'
// import { ApiProperty } from '@nestjs/swagger';

export class AddOutboundShipmentItemDto {
  // @ApiProperty({ example: 'uuid-of-product', description: 'ID of the product to be shipped' })
  @IsNotEmpty()
  @IsUUID()
  product_id: string;

  // @ApiProperty({ example: 5, description: 'Ordered quantity of the product', minimum: 1 })
  @IsInt()
  @Min(1, { message: 'Ordered quantity must be at least 1' })
  quantity_ordered: number;

  // @ApiProperty({ example: 150.99, description: 'Selling price at the moment of shipment (optional)', required: false, type: 'number', format: 'float', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  selling_price_at_shipment?: number;

  // quantity_shipped будет 0 по умолчанию (согласно Prisma schema) и обновится при фактической отгрузке.
  // source_storage_cell_id (из какой ячейки брать) - эту логику мы реализуем в сервисе при обработке отгрузки,
  // либо это поле можно добавить сюда, если пользователь должен явно указывать ячейку для каждой позиции заказа.
  // Для начала упростим и не будем требовать ячейку на этом этапе.
}