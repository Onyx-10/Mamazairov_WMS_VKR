// backend/src/outbound-shipments/dto/create-outbound-shipment.dto.ts
import { Type } from 'class-transformer'; // Для преобразования строки в Date, если используется
import {
	IsDateString,
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator'
// import { ApiProperty } from '@nestjs/swagger';

export class CreateOutboundShipmentDto {
  // @ApiProperty({ example: 'ORD-2024-001', description: 'Unique document number for the outbound shipment', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  document_number: string; // Может генерироваться на сервере или вводиться пользователем

  // @ApiProperty({ example: 'ООО "Клиент Плюс", ул. Примерная, д.10', description: 'Details about the customer or destination', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500) // Ограничение на длину описания клиента
  customer_details?: string;

  // @ApiProperty({ example: '2024-07-20T14:00:00.000Z', description: 'Planned shipping date', required: false, type: 'string', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  @Type(() => Date) // Преобразует валидную строку даты в объект Date, если ValidationPipe настроен с transform:true
  planned_shipping_date?: Date;

  // @ApiProperty({ example: 'Handle with care, fragile items.', description: 'Optional notes about the shipment', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  // created_by_user_id будет взят из JWT на сервере.
  // status по умолчанию будет NEW (согласно Prisma schema).
  // actual_shipping_date будет установлен при фактической отгрузке.
}