import {
	Body,
	Controller,
	Delete,
	Get, // Для получения userId из JWT
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Request,
	UseGuards,
} from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { AddInboundShipmentItemDto } from './dto/add-inbound-shipment-item.dto'
import { CreateInboundShipmentDto } from './dto/create-inbound-shipment.dto'
import { UpdateInboundShipmentItemDto } from './dto/update-inbound-shipment-item.dto'
import { InboundShipmentsService } from './inbound-shipments.service'
// import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

// @ApiTags('inbound-shipments')
@Controller('inbound-shipments')
@UseGuards(JwtAuthGuard, RolesGuard) // Защищаем все эндпоинты контроллера
export class InboundShipmentsController {
  constructor(
    private readonly inboundShipmentsService: InboundShipmentsService,
  ) {}

  // --- Создание "шапки" документа приемки ---
  // @ApiOperation({ summary: 'Create a new inbound shipment document header' })
  // @ApiBearerAuth() @ApiBody({ type: CreateInboundShipmentDto })
  // @ApiResponse({ status: HttpStatus.CREATED, description: 'Shipment header created.'})
  @Post()
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  @HttpCode(HttpStatus.CREATED)
  async createShipment(
    @Body() createInboundShipmentDto: CreateInboundShipmentDto,
    @Request() req, // Для получения ID пользователя из JWT
  ) {
    const userId = req.user.id; // JwtStrategy добавляет user с id в request
    return this.inboundShipmentsService.createShipment(
      createInboundShipmentDto,
      userId,
    );
  }

  // --- Получение списка всех приемок ---
  // @ApiOperation({ summary: 'Get all inbound shipments' })
  // @ApiBearerAuth() @ApiResponse({ status: HttpStatus.OK, description: 'List of shipments.'})
  @Get()
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async findAllShipments() {
    return this.inboundShipmentsService.findAllShipments();
  }

  // --- Получение одной приемки по ID ---
  // @ApiOperation({ summary: 'Get an inbound shipment by ID' })
  // @ApiBearerAuth() @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Shipment data.'})
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Shipment not found.'})
  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async findOneShipment(@Param('id', ParseUUIDPipe) id: string) {
    const shipment = await this.inboundShipmentsService.findOneShipmentById(id);
    if (!shipment) {
      throw new NotFoundException(`Inbound shipment with ID "${id}" not found.`);
    }
    return shipment;
  }

  // --- Добавление позиции в приемку ---
  // @ApiOperation({ summary: 'Add an item to an inbound shipment' })
  // @ApiBearerAuth() @ApiParam({ name: 'shipmentId', type: 'string', format: 'uuid' })
  // @ApiBody({ type: AddInboundShipmentItemDto })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Item added, returns updated shipment.'})
  @Post(':shipmentId/items')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  @HttpCode(HttpStatus.OK) // Или CREATED, если считаем добавление элемента созданием
  async addItemToShipment(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Body() addItemDto: AddInboundShipmentItemDto,
  ) {
    return this.inboundShipmentsService.addItemToShipment(shipmentId, addItemDto);
  }

  // --- Обновление позиции в приемке ---
  // @ApiOperation({ summary: 'Update an item in an inbound shipment' })
  // @ApiBearerAuth()
  // @ApiParam({ name: 'shipmentId', type: 'string', format: 'uuid' })
  // @ApiParam({ name: 'itemId', type: 'string', format: 'uuid' })
  // @ApiBody({ type: UpdateInboundShipmentItemDto })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Item updated, returns updated shipment.'})
  @Patch(':shipmentId/items/:itemId')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async updateShipmentItem(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateItemDto: UpdateInboundShipmentItemDto,
  ) {
    return this.inboundShipmentsService.updateShipmentItem(
      shipmentId,
      itemId,
      updateItemDto,
    );
  }

  // --- Удаление позиции из приемки ---
  // @ApiOperation({ summary: 'Remove an item from an inbound shipment' })
  // @ApiBearerAuth()
  // @ApiParam({ name: 'shipmentId', type: 'string', format: 'uuid' })
  // @ApiParam({ name: 'itemId', type: 'string', format: 'uuid' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Item removed, returns updated shipment.'})
  @Delete(':shipmentId/items/:itemId')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async removeShipmentItem(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.inboundShipmentsService.removeShipmentItem(shipmentId, itemId);
  }

  // --- Завершение приемки (оприходование товаров) ---
  // @ApiOperation({ summary: 'Process and complete an inbound shipment (receive goods)' })
  // @ApiBearerAuth() @ApiParam({ name: 'shipmentId', type: 'string', format: 'uuid' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Shipment processed and completed.'})
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid shipment state or missing data for items.'})
  @Post(':shipmentId/process')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  @HttpCode(HttpStatus.OK)
  async processReceipt(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Request() req, // Для получения ID пользователя из JWT
    // Можно добавить DTO, если для обработки нужны доп. данные от клиента,
    // например, @Body() processReceiptDto: ProcessReceiptDto
  ) {
    const userId = req.user.id;
    return this.inboundShipmentsService.processReceipt(shipmentId, userId);
  }
}