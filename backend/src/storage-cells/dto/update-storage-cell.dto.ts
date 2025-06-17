// backend/src/storage-cells/dto/update-storage-cell.dto.ts
import { PartialType } from '@nestjs/mapped-types'; // Убедись, что @nestjs/mapped-types установлен
import { CreateStorageCellDto } from './create-storage-cell.dto'

export class UpdateStorageCellDto extends PartialType(CreateStorageCellDto) {}