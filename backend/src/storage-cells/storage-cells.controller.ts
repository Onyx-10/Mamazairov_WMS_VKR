// backend/src/storage-cells/storage-cells.controller.ts
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CreateStorageCellDto } from './dto/create-storage-cell.dto'
import { UpdateStorageCellDto } from './dto/update-storage-cell.dto'
import { StorageCellsService } from './storage-cells.service'
// import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

// @ApiTags('storage-cells')
@Controller('storage-cells')
export class StorageCellsController {
  constructor(private readonly storageCellsService: StorageCellsService) {}

  // --- Создание ячейки хранения (только для MANAGER) ---
  // @ApiOperation({ summary: 'Create a new storage cell (MANAGER only)' })
  // @ApiBearerAuth()
  // @ApiBody({ type: CreateStorageCellDto })
  // @ApiResponse({ status: HttpStatus.CREATED, description: 'Storage cell created successfully.' })
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  // @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Storage cell code already exists.' })
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  // @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden (User is not a MANAGER).' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStorageCellDto: CreateStorageCellDto) {
    return this.storageCellsService.create(createStorageCellDto);
  }

  // --- Получение списка всех (активных) ячеек (MANAGER и WAREHOUSE_KEEPER) ---
  // @ApiOperation({ summary: 'Get all active storage cells (MANAGER & WAREHOUSE_KEEPER)' })
  // @ApiBearerAuth()
  // @ApiResponse({ status: HttpStatus.OK, description: 'List of active storage cells.' })
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard) // RolesGuard здесь применится, но @Roles определяет, кто пройдет
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER) // Обе роли могут просматривать
  async findAll() {
    return this.storageCellsService.findAll();
  }

  // --- Получение одной ячейки по ID (MANAGER и WAREHOUSE_KEEPER) ---
  // @ApiOperation({ summary: 'Get a storage cell by ID (MANAGER & WAREHOUSE_KEEPER)' })
  // @ApiBearerAuth()
  // @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Storage Cell ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Storage cell data.' })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Storage cell not found.' })
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const cell = await this.storageCellsService.findOneById(id);
    if (!cell) {
      throw new NotFoundException(`Storage cell with ID "${id}" not found.`);
    }
    return cell;
  }

  // --- Обновление ячейки по ID (только для MANAGER) ---
  // @ApiOperation({ summary: 'Update a storage cell by ID (MANAGER only)' })
  // @ApiBearerAuth()
  // @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Storage Cell ID' })
  // @ApiBody({ type: UpdateStorageCellDto })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Storage cell updated successfully.' })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Storage cell not found.' })
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  // @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Storage cell code already exists.' })
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  // @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden (User is not a MANAGER).' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStorageCellDto: UpdateStorageCellDto,
  ) {
    return this.storageCellsService.update(id, updateStorageCellDto);
  }

  // --- Удаление ячейки по ID (только для MANAGER) ---
  // @ApiOperation({ summary: 'Delete a storage cell by ID (MANAGER only)' })
  // @ApiBearerAuth()
  // @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Storage Cell ID' })
  // @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Storage cell deleted successfully.' })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Storage cell not found.' })
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  // @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden (User is not a MANAGER).' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.storageCellsService.remove(id);
    // Для статуса 204 (NO_CONTENT) не должно быть тела ответа.
  }
}