import {
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
} from 'class-validator'
// import { ApiProperty } from '@nestjs/swagger'; // Для Swagger

export class CreateProductDto {
  // @ApiProperty({ example: 'Ноутбук игровой Thunder X1', description: 'Name of the product' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  // @ApiProperty({ example: 'THUNDERX1-BLK', description: 'Stock Keeping Unit (SKU), unique', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  // @ApiProperty({ example: 'Мощный игровой ноутбук с видеокартой RTX 4090', description: 'Optional product description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  // @ApiProperty({ example: 'шт', description: 'Unit of measure (e.g., pcs, kg, liter)', maxLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  unit_of_measure: string;

  // @ApiProperty({ example: 1500.99, description: 'Purchase price of the product', required: false, type: 'number', format: 'float', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }) // Для Decimal с двумя знаками после запятой
  @Min(0)
  purchase_price?: number; // Prisma Decimal преобразуется в number в JS/TS

  // @ApiProperty({ example: 10, description: 'Minimum stock level for alerts', required: false, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  min_stock_level?: number;

  // @ApiProperty({ example: 100, description: 'Maximum stock level', required: false, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_stock_level?: number;

  // @ApiProperty({ example: 'uuid-of-category', description: 'ID of the product category (UUID)', required: false })
  @IsOptional()
  @IsUUID() // Если category_id это UUID
  category_id?: string;

  // @ApiProperty({ example: 'uuid-of-supplier', description: 'ID of the main supplier (UUID)', required: false })
  @IsOptional()
  @IsUUID() // Если supplier_id это UUID
  supplier_id?: string;
}