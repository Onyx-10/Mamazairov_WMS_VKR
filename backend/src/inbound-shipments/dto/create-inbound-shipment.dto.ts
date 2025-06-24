import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
// import { ApiProperty } from '@nestjs/swagger';

export class CreateInboundShipmentDto {
  // @ApiProperty({ example: 'REC-2024-001', description: 'Document number for the inbound shipment', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  document_number: string; // Может генерироваться на сервере или вводиться пользователем

  // @ApiProperty({ example: '2024-07-15T00:00:00.000Z', description: 'Expected date of arrival', required: false })
  @IsOptional()
  @IsDateString()
  expected_date?: string; // Или Date, если настроен transform

  // @ApiProperty({ example: 'uuid-of-supplier', description: 'ID of the supplier (UUID)', required: false })
  @IsOptional()
  @IsUUID()
  supplier_id?: string;

  // @ApiProperty({ example: 'Notes about the shipment', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  // created_by_user_id будет браться из JWT на сервере
  // status по умолчанию будет PLANNED
}