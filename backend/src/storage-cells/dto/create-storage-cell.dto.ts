// backend/src/storage-cells/dto/create-storage-cell.dto.ts
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator'
// Если будешь использовать Swagger, пригодятся декораторы ApiProperty
// import { ApiProperty } from '@nestjs/swagger';

export class CreateStorageCellDto {
  // @ApiProperty({ example: 'A-01-01', description: 'Unique code of the storage cell', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50) // Пример ограничения длины для кода ячейки
  code: string;

  // @ApiProperty({ example: 'Upper shelf, near the window', description: 'Optional description of the cell', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  // @ApiProperty({ example: 100, description: 'Maximum number of items the cell can hold', minimum: 1 })
  @IsInt()
  @Min(1) // Ячейка должна вмещать хотя бы 1 предмет
  max_items_capacity: number; // В Prisma это Int, в DTO number совместим

  // @ApiProperty({ example: true, description: 'Is the cell currently active and usable', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}