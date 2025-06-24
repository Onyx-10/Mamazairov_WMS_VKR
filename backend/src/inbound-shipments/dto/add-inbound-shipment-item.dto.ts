import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator'
// import { ApiProperty } from '@nestjs/swagger';

export class AddInboundShipmentItemDto {
  // @ApiProperty({ example: 'uuid-of-product', description: 'ID of the product (UUID)' })
  @IsNotEmpty()
  @IsUUID()
  product_id: string;

  // @ApiProperty({ example: 10, description: 'Expected quantity of the product', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity_expected: number;
  
  // @ApiProperty({ example: 10, description: 'Actually received quantity (can be set later or during receipt)', minimum: 0, required: false })
  @IsOptional() // При добавлении может быть еще не известно, или равно expected
  @IsInt()
  @Min(0)
  quantity_received?: number;

  // @ApiProperty({ example: 120.50, description: 'Purchase price at the moment of receipt', required: false, type: 'number', format: 'float', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchase_price_at_receipt?: number;

  // target_storage_cell_id будет заполняться при размещении товара
}