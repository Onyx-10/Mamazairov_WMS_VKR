import { IsInt, IsNotEmpty, Min } from 'class-validator'

export class UpdateCellContentQuantityDto {
  @IsInt()
  @Min(0) // Разрешаем 0 для удаления
  @IsNotEmpty()
  quantity: number;
}