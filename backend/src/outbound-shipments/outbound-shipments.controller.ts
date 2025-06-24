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
import { AddOutboundShipmentItemDto } from './dto/add-outbound-shipment-item.dto'
import { CreateOutboundShipmentDto } from './dto/create-outbound-shipment.dto'
import { UpdateOutboundShipmentItemDto } from './dto/update-outbound-shipment-item.dto'
import { OutboundShipmentsService } from './outbound-shipments.service'
// import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

// @ApiTags('outbound-shipments')
@Controller('outbound-shipments')
@UseGuards(JwtAuthGuard, RolesGuard) // Защищаем все эндпоинты контроллера
export class OutboundShipmentsController {
  constructor(
    private readonly outboundShipmentsService: OutboundShipmentsService,
  ) {}

  // --- Создание "шапки" документа отгрузки ---
  // @ApiOperation({ summary: 'Create a new outbound shipment document header' })
  // @ApiBearerAuth() @ApiBody({ type: CreateOutboundShipmentDto })
  // @ApiResponse({ status: HttpStatus.CREATED, description: 'Shipment header created.'})
  @Post()
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  @HttpCode(HttpStatus.CREATED)
  async createShipment(
    @Body() createOutboundShipmentDto: CreateOutboundShipmentDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.outboundShipmentsService.createShipment(
      createOutboundShipmentDto,
      userId,
    );
  }

  // --- Получение списка всех отгрузок ---
  // @ApiOperation({ summary: 'Get all outbound shipments' })
  // @ApiBearerAuth() @ApiResponse({ status: HttpStatus.OK, description: 'List of shipments.'})
  @Get()
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async findAllShipments() {
    return this.outboundShipmentsService.findAllShipments();
  }

  // --- Получение одной отгрузки по ID ---
  // @ApiOperation({ summary: 'Get an outbound shipment by ID' })
  // @ApiBearerAuth() @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Shipment data.'})
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Shipment not found.'})
  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async findOneShipment(@Param('id', ParseUUIDPipe) id: string) {
    const shipment = await this.outboundShipmentsService.findOneShipmentById(id);
    if (!shipment) {
      throw new NotFoundException(`Outbound shipment with ID "${id}" not found.`);
    }
    return shipment;
  }

  // --- Добавление позиции в отгрузку ---
  // @ApiOperation({ summary: 'Add an item to an outbound shipment' })
  // @ApiBearerAuth() @ApiParam({ name: 'shipmentId', type: 'string', format: 'uuid' })
  // @ApiBody({ type: AddOutboundShipmentItemDto })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Item added, returns updated shipment.'})
  @Post(':shipmentId/items')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  @HttpCode(HttpStatus.OK)
  async addItemToShipment(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Body() addItemDto: AddOutboundShipmentItemDto,
  ) {
    return this.outboundShipmentsService.addItemToShipment(shipmentId, addItemDto);
  }

  // --- Обновление позиции в отгрузке ---
  // @ApiOperation({ summary: 'Update an item in an outbound shipment' })
  // @ApiBearerAuth()
  // @ApiParam({ name: 'shipmentId', type: 'string', format: 'uuid' })
  // @ApiParam({ name: 'itemId', type: 'string', format: 'uuid' })
  // @ApiBody({ type: UpdateOutboundShipmentItemDto })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Item updated, returns updated shipment.'})
  @Patch(':shipmentId/items/:itemId')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async updateShipmentItem(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateItemDto: UpdateOutboundShipmentItemDto,
  ) {
    return this.outboundShipmentsService.updateShipmentItem(
      shipmentId,
      itemId,
      updateItemDto,
    );
  }

  // --- Удаление позиции из отгрузки ---
  // @ApiOperation({ summary: 'Remove an item from an outbound shipment' })
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
    return this.outboundShipmentsService.removeShipmentItem(shipmentId, itemId);
  }

  // --- Завершение отгрузки (списание товаров) ---
  // @ApiOperation({ summary: 'Process and complete an outbound shipment (dispatch goods)' })
  // @ApiBearerAuth() @ApiParam({ name: 'shipmentId', type: 'string', format: 'uuid' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Shipment processed and completed.'})
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid shipment state or not enough stock.'})
  @Post(':shipmentId/dispatch') // или /process, как у приемок
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  @HttpCode(HttpStatus.OK)
  async processDispatch(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.outboundShipmentsService.processDispatch(shipmentId, userId);
  }
}