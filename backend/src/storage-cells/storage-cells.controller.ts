import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException,
  Param, ParseUUIDPipe, Patch, Post, Query, Request, UseGuards, // Добавлен Query
} from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { AddProductToCellDto } from './dto/add-product-to-cell.dto'
import { CreateStorageCellDto } from './dto/create-storage-cell.dto'
import { UpdateCellContentQuantityDto } from './dto/update-cell-content-quantity.dto'
import { UpdateStorageCellDto } from './dto/update-storage-cell.dto'
import { CellContentDetailed, StorageCellsService, StorageCellWithDetails } from './storage-cells.service'

@Controller('storage-cells')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageCellsController {
  constructor(private readonly storageCellsService: StorageCellsService) {}

  @Post()
  @Roles(UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStorageCellDto: CreateStorageCellDto) {
    return this.storageCellsService.create(createStorageCellDto);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  async findAll(@Query('isActive') isActiveQuery?: string): Promise<StorageCellWithDetails[]> {
    let isActiveFilter: boolean | undefined = undefined;
    if (isActiveQuery === 'true') {
      isActiveFilter = true;
    } else if (isActiveQuery === 'false') {
      isActiveFilter = false;
    }
    // Если isActiveQuery не 'true' и не 'false', фильтр не применяется
    return this.storageCellsService.findAll(isActiveFilter);
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
    @Body() updateDto: UpdateCellContentQuantityDto,
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

  @Delete('contents/:cellContentId') 
  @Roles(UserRole.MANAGER, UserRole.WAREHOUSE_KEEPER)
  @HttpCode(HttpStatus.OK) 
  async deleteProductFromCell(
    @Param('cellContentId', ParseUUIDPipe) cellContentId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    // Вызываем updateProductQuantityInCell с quantity = 0 для удаления
    await this.storageCellsService.updateProductQuantityInCell(cellContentId, 0, userId);
    return { message: `Product content (ID: ${cellContentId}) successfully removed/zeroed.` };
  }
}