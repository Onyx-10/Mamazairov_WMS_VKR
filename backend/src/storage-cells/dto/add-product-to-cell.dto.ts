// backend/src/storage-cells/dto/add-product-to-cell.dto.ts
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator'

export class AddProductToCellDto {
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}