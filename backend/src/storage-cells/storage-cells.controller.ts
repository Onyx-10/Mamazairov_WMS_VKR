// backend/src/storage-cells/storage-cells.controller.ts
import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException,
  Param, ParseUUIDPipe, Patch, Post, Request, UseGuards,
} from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { AddProductToCellDto } from './dto/add-product-to-cell.dto'
import { CreateStorageCellDto } from './dto/create-storage-cell.dto'
import { UpdateCellContentQuantityDto } from './dto/update-cell-content-quantity.dto'; // Этот DTO используется
import { UpdateStorageCellDto } from './dto/update-storage-cell.dto'
import { CellContentDetailed, StorageCellsService, StorageCellWithDetails } from './storage-cells.service'

@Controller('storage-cells')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageCellsController {
  constructor(private readonly storageCellsService: StorageCellsService) {}

  // --- CRUD для самих ячеек ---
  // ... (методы create, findAll, findOne (для ячеек), update (для ячеек), remove (для ячеек) остаются БЕЗ ИЗМЕНЕНИЙ)
  @Post()
  @Roles(UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStorageCellDto: CreateStorageCellDto) {
    return this.storageCellsService.create(createStorageCellDto);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async findAll(): Promise<StorageCellWithDetails[]> {
    return this.storageCellsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<StorageCellWithDetails> {
    const cell = await this.storageCellsService.findOneById(id);
    if (!cell) {
      throw new NotFoundException(`Storage cell with ID "${id}" not found.`);
    }
    return cell;
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStorageCellDto: UpdateStorageCellDto,
  ) {
    return this.storageCellsService.update(id, updateStorageCellDto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.storageCellsService.remove(id);
  }


  // --- Эндпоинты для управления содержимым конкретной ячейки ---

  @Get(':cellId/contents')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async getCellContents(@Param('cellId', ParseUUIDPipe) cellId: string): Promise<CellContentDetailed[]> {
    return this.storageCellsService.findCellContents(cellId);
  }

  @Post(':cellId/contents')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  @HttpCode(HttpStatus.OK)
  async addProductToCell(
    @Param('cellId', ParseUUIDPipe) cellId: string,
    @Body() addProductToCellDto: AddProductToCellDto,
    @Request() req,
  ): Promise<CellContentDetailed> {
    const userId = req.user.id;
    return this.storageCellsService.addProductToCell(
      cellId,
      addProductToCellDto.productId,
      addProductToCellDto.quantity,
      userId,
    );
  }

  @Patch('contents/:cellContentId/quantity')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  @HttpCode(HttpStatus.OK)
  async updateProductQuantityInCell(
    @Param('cellContentId', ParseUUIDPipe) cellContentId: string,
    @Body() updateDto: UpdateCellContentQuantityDto, // DTO с { quantity: number }
    @Request() req,
  ): Promise<CellContentDetailed | { message: string }> {
    const userId = req.user.id;
    const result = await this.storageCellsService.updateProductQuantityInCell(
      cellContentId,
      updateDto.quantity,
      userId,
    );
    if (result === null) {
        return { message: 'Product record removed from cell as quantity became zero.' };
    }
    return result;
  }

  // Удалить ПОЛНОСТЬЮ товар (запись CellContent) из ячейки
  // Теперь вызывает updateProductQuantityInCell с quantity = 0
  @Delete('contents/:cellContentId')
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  @HttpCode(HttpStatus.OK) // Возвращаем сообщение, т.к. сервис теперь может вернуть null или объект
  async deleteProductFromCell(
    @Param('cellContentId', ParseUUIDPipe) cellContentId: string,
    @Request() req,
  ): Promise<{ message: string }> { // Явно указываем тип возвращаемого значения
    const userId = req.user.id;
    const result = await this.storageCellsService.updateProductQuantityInCell(
      cellContentId,
      0, // Устанавливаем количество в 0 для удаления
      userId,
    );
    // Сервис updateProductQuantityInCell вернет null, если запись была удалена.
    // Здесь мы просто возвращаем сообщение об успехе.
    // В реальном приложении можно было бы вернуть 204 No Content, если result === null,
    // но это потребует использования @Res() и response.status(204).send().
    return { message: `Product content (ID: ${cellContentId}) processed for removal.` };
  }
}