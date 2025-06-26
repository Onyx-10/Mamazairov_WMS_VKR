import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, StorageCell } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateStorageCellDto } from './dto/create-storage-cell.dto'
import { UpdateStorageCellDto } from './dto/update-storage-cell.dto'

// Экспортируемые типы (если они нужны контроллеру или другим сервисам)
export interface CellContentDetailed {
  id: string;
  quantity: number;
  product: { id: string; name: string; sku: string; unit_of_measure: string; };
}
export type StorageCellWithDetails = StorageCell & {
  current_occupancy: number;
  cell_contents_detailed?: CellContentDetailed[];
};

@Injectable()
export class StorageCellsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStorageCellDto: CreateStorageCellDto): Promise<StorageCell> {
    const { code, description, max_items_capacity, is_active } = createStorageCellDto;
    const existingCell = await this.prisma.storageCell.findUnique({ where: { code } });
    if (existingCell) {
      throw new ConflictException(`Storage cell with code "${code}" already exists.`);
    }
    try {
      return this.prisma.storageCell.create({
        data: {
          code,
          description,
          max_items_capacity,
          is_active: is_active !== undefined ? is_active : true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Storage cell with code "${code}" already exists (race condition).`);
      }
      console.error("Error creating storage cell:", error);
      throw new InternalServerErrorException('Could not create storage cell.');
    }
  }

  async findAll(isActiveFilter?: boolean): Promise<StorageCellWithDetails[]> { // Добавлен опциональный фильтр
    const whereClause: Prisma.StorageCellWhereInput = {};
    if (isActiveFilter !== undefined) {
      whereClause.is_active = isActiveFilter;
    }

    const cells = await this.prisma.storageCell.findMany({
      where: whereClause, // Применяем фильтр
      include: { 
        cell_contents: { // Включаем для подсчета current_occupancy
          select: { quantity: true } 
        } 
      },
      orderBy: { code: 'asc' },
    });

    return cells.map(cell => {
      const current_occupancy = cell.cell_contents.reduce((sum, item) => sum + item.quantity, 0);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { cell_contents, ...cellData } = cell; // Удаляем cell_contents из ответа для списка
      return { 
        ...cellData, 
        current_occupancy, 
        // cell_contents_detailed не загружаем для списка всех ячеек, только для findOneById
      };
    });
  }

  async findOneById(id: string): Promise<StorageCellWithDetails | null> {
    const cell = await this.prisma.storageCell.findUnique({
      where: { id },
      include: {
        cell_contents: {
          include: { product: { select: { id: true, name: true, sku: true, unit_of_measure: true } } },
          orderBy: { product: { name: 'asc' } },
        },
      },
    });
    if (!cell) return null;
    const current_occupancy = cell.cell_contents.reduce((sum, item) => sum + item.quantity, 0);
    const cell_contents_detailed: CellContentDetailed[] = cell.cell_contents.map(cc => ({
      id: cc.id, quantity: cc.quantity, product: cc.product,
    }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cell_contents, ...cellData } = cell;
    return { ...cellData, current_occupancy, cell_contents_detailed };
  }

  async update(id: string, updateStorageCellDto: UpdateStorageCellDto): Promise<StorageCell> {
    const { code, ...dataToUpdateFromDto } = updateStorageCellDto;
    const existingCell = await this.prisma.storageCell.findUnique({ where: { id } });
    if (!existingCell) throw new NotFoundException(`Storage cell with ID "${id}" not found.`);
    
    const dataToUpdate: Prisma.StorageCellUpdateInput = { ...dataToUpdateFromDto };
    if (dataToUpdateFromDto.is_active !== undefined) { // Явно обрабатываем is_active
        dataToUpdate.is_active = dataToUpdateFromDto.is_active;
    }

    if (code && code !== existingCell.code) {
      const cellWithNewCode = await this.prisma.storageCell.findUnique({ where: { code } });
      if (cellWithNewCode && cellWithNewCode.id !== id) {
        throw new ConflictException(`Storage cell with code "${code}" already exists.`);
      }
      dataToUpdate.code = code;
    }
    try {
      return this.prisma.storageCell.update({ where: { id }, data: dataToUpdate });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') throw new NotFoundException(`Storage cell with ID "${id}" not found during update.`);
        if (error.code === 'P2002' && code) throw new ConflictException(`Storage cell with code "${code}" already exists.`);
      }
      console.error("Error updating storage cell:", error);
      throw new InternalServerErrorException('Could not update storage cell.');
    }
  }

  async remove(id: string): Promise<StorageCell> {
    // Сначала проверяем, существует ли ячейка
    const cell = await this.prisma.storageCell.findUnique({
      where: { id },
      include: { _count: { select: { cell_contents: true } } }, // Считаем содержимое
    });

    if (!cell) {
      throw new NotFoundException(`Storage cell with ID "${id}" not found, cannot delete.`);
    }

    // Затем проверяем, пуста ли она
    if (cell._count.cell_contents > 0) {
      throw new ConflictException(
        `Cannot delete storage cell "${cell.code}" because it is not empty. ` +
        `It contains ${cell._count.cell_contents} item(s)/record(s).`
      );
    }

    // Если все проверки пройдены, удаляем
    try {
      return this.prisma.storageCell.delete({
        where: { id },
      });
    } catch (error) {
      // P2025 (запись не найдена) уже должна быть отловлена findUnique выше.
      // Здесь могут быть другие ошибки, например, нарушение внешних ключей, если схема это допускает.
      console.error("Error deleting storage cell:", error);
      throw new InternalServerErrorException('Could not delete storage cell.');
    }
  }

  async findCellContents(cellId: string): Promise<CellContentDetailed[]> {
    const cell = await this.prisma.storageCell.findUnique({ where: { id: cellId } });
    if (!cell) throw new NotFoundException(`Storage cell with ID "${cellId}" not found.`);
    const contents = await this.prisma.cellContent.findMany({
      where: { storage_cell_id: cellId },
      include: { product: { select: { id: true, name: true, sku: true, unit_of_measure: true } } },
      orderBy: { product: { name: 'asc' } },
    });
    return contents.map(cc => ({ 
        id: cc.id, 
        quantity: cc.quantity, 
        product: {
            id: cc.product.id,
            name: cc.product.name,
            sku: cc.product.sku,
            unit_of_measure: cc.product.unit_of_measure
        } 
    }));
  }

  async addProductToCell(cellId: string, productId: string, quantity: number, userId: string): Promise<CellContentDetailed> {
    if (quantity <= 0) throw new BadRequestException('Quantity to add must be positive.');
    return this.prisma.$transaction(async (tx) => {
      const cell = await tx.storageCell.findUnique({ where: { id: cellId } });
      if (!cell) throw new NotFoundException(`Storage cell ID "${cellId}" not found.`);
      if (!cell.is_active) throw new BadRequestException(`Storage cell "${cell.code}" is not active. Cannot add products.`);
      
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundException(`Product with ID "${productId}" not found.`);
      
      const cellContents = await tx.cellContent.findMany({ where: { storage_cell_id: cellId } });
      const currentOccupancy = cellContents.reduce((sum, content) => sum + content.quantity, 0);
      if (currentOccupancy + quantity > cell.max_items_capacity) {
        throw new ConflictException(`Not enough capacity in cell "${cell.code}". Current: ${currentOccupancy}, Add: ${quantity}, Capacity: ${cell.max_items_capacity}.`);
      }

      let updatedOrCreatedCellContent: Prisma.CellContentGetPayload<{include: {product: {select: {id:true, name:true, sku:true, unit_of_measure:true}}}}>;
      const existingContent = await tx.cellContent.findUnique({
        where: { product_id_storage_cell_id: { product_id: productId, storage_cell_id: cellId } },
        include: { product: {select: {id:true, name:true, sku:true, unit_of_measure:true}} }
      });

      if (existingContent) {
        updatedOrCreatedCellContent = await tx.cellContent.update({
          where: { id: existingContent.id }, data: { quantity: { increment: quantity } },
          include: { product: {select: {id:true, name:true, sku:true, unit_of_measure:true}} }
        });
      } else {
        updatedOrCreatedCellContent = await tx.cellContent.create({
          data: { product_id: productId, storage_cell_id: cellId, quantity: quantity },
          include: { product: {select: {id:true, name:true, sku:true, unit_of_measure:true}} }
        });
      }
      await tx.stockMovement.create({
        data: {
          product_id: productId, quantity_changed: quantity, type: 'ADJUSTMENT_PLUS',
          storage_cell_id: cellId, user_id: userId, reason: `Added ${quantity} of ${product.name} to cell ${cell.code}`,
          occurred_at: new Date(),
        }
      });
      return { 
        id: updatedOrCreatedCellContent.id, quantity: updatedOrCreatedCellContent.quantity, 
        product: {
            id: updatedOrCreatedCellContent.product.id, name: updatedOrCreatedCellContent.product.name,
            sku: updatedOrCreatedCellContent.product.sku, unit_of_measure: updatedOrCreatedCellContent.product.unit_of_measure
        }
      };
    });
  }

  async updateProductQuantityInCell(
    cellContentId: string, newQuantity: number, userId: string
  ): Promise<CellContentDetailed | null> {
    if (newQuantity < 0) throw new BadRequestException('New quantity cannot be negative.');
    return this.prisma.$transaction(async (tx) => {
      const currentContent = await tx.cellContent.findUnique({
        where: { id: cellContentId }, include: { product: true, storage_cell: true },
      });
      if (!currentContent) throw new NotFoundException(`Content item ID "${cellContentId}" not found.`);
      if (!currentContent.storage_cell.is_active) throw new BadRequestException(`Storage cell "${currentContent.storage_cell.code}" is not active. Cannot modify content.`);

      const quantityChange = newQuantity - currentContent.quantity;
      if (quantityChange === 0) {
        return { id: currentContent.id, quantity: currentContent.quantity, product: {id: currentContent.product.id, name: currentContent.product.name, sku: currentContent.product.sku, unit_of_measure: currentContent.product.unit_of_measure } };
      }
      
      if (newQuantity > currentContent.quantity) {
          const cell = currentContent.storage_cell;
          const cellContents = await tx.cellContent.findMany({ where: { storage_cell_id: cell.id } });
          const otherItemsOccupancy = cellContents.filter(cc => cc.id !== cellContentId).reduce((sum, content) => sum + content.quantity, 0);
          if (otherItemsOccupancy + newQuantity > cell.max_items_capacity) {
              throw new ConflictException(`Not enough capacity in cell "${cell.code}". Occupied by other items: ${otherItemsOccupancy}, New qty for this: ${newQuantity}, Capacity: ${cell.max_items_capacity}.`);
          }
      }
      let updatedContentResult: CellContentDetailed | null = null;
      if (newQuantity === 0) {
        await tx.cellContent.delete({ where: { id: cellContentId } });
      } else {
        const updatedPrismaContent = await tx.cellContent.update({
          where: { id: cellContentId }, data: { quantity: newQuantity },
          include: { product: { select: { id: true, name: true, sku: true, unit_of_measure: true } } },
        });
        updatedContentResult = { id: updatedPrismaContent.id, quantity: updatedPrismaContent.quantity, product: updatedPrismaContent.product };
      }
      await tx.stockMovement.create({
        data: {
          product_id: currentContent.product_id, quantity_changed: quantityChange, 
          type: quantityChange > 0 ? 'ADJUSTMENT_PLUS' : 'ADJUSTMENT_MINUS',
          storage_cell_id: currentContent.storage_cell_id, user_id: userId,
          reason: `Qty for ${currentContent.product.name} in ${currentContent.storage_cell.code} changed: ${currentContent.quantity} -> ${newQuantity}`,
          occurred_at: new Date(),
        },
      });
      return updatedContentResult;
    });
  }
}