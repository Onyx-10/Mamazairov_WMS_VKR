// backend/src/storage-cells/storage-cells.service.ts
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

  // ... методы create, findAll, findOneById, update, remove (для ячеек) ...
  // (Они остаются как в предыдущей полной версии сервиса, которую я давал)
  async create(createStorageCellDto: CreateStorageCellDto): Promise<StorageCell> {
    const { code, description, max_items_capacity, is_active } = createStorageCellDto;
    const existingCell = await this.prisma.storageCell.findUnique({ where: { code } });
    if (existingCell) {
      throw new ConflictException(`Storage cell with code "${code}" already exists.`);
    }
    try {
      return this.prisma.storageCell.create({
        data: { code, description, max_items_capacity, is_active: is_active !== undefined ? is_active : true, },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Storage cell with code "${code}" already exists (race condition).`);
      }
      console.error("Error creating storage cell:", error);
      throw new InternalServerErrorException('Could not create storage cell.');
    }
  }

  async findAll(): Promise<StorageCellWithDetails[]> {
    const cells = await this.prisma.storageCell.findMany({
      where: { is_active: true },
      include: { cell_contents: { select: { quantity: true } } },
      orderBy: { code: 'asc' },
    });
    return cells.map(cell => {
      const current_occupancy = cell.cell_contents.reduce((sum, item) => sum + item.quantity, 0);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { cell_contents, ...cellData } = cell;
      return { ...cellData, current_occupancy, cell_contents_detailed: [] };
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
        if (error.code === 'P2002' && code) throw new ConflictException(`Storage cell with code "${code}" already exists (race condition).`);
      }
      console.error("Error updating storage cell:", error);
      throw new InternalServerErrorException('Could not update storage cell.');
    }
  }

  async remove(id: string): Promise<StorageCell> {
    const cellWithContents = await this.prisma.storageCell.findUnique({
      where: { id }, include: { _count: { select: { cell_contents: true } } },
    });
    if (!cellWithContents) throw new NotFoundException(`Storage cell with ID "${id}" not found, cannot delete.`);
    if (cellWithContents._count.cell_contents > 0) {
      throw new ConflictException(`Cannot delete cell "${cellWithContents.code}" because it is not empty.`);
    }
    try {
      return this.prisma.storageCell.delete({ where: { id } });
    } catch (error) {
      console.error("Error deleting storage cell:", error);
      throw new InternalServerErrorException('Could not delete storage cell.');
    }
  }


  async findCellContents(cellId: string): Promise<CellContentDetailed[]> {
    // ... (код как был)
    const cell = await this.prisma.storageCell.findUnique({ where: { id: cellId } });
    if (!cell) throw new NotFoundException(`Storage cell with ID "${cellId}" not found.`);
    const contents = await this.prisma.cellContent.findMany({
      where: { storage_cell_id: cellId },
      include: { product: { select: { id: true, name: true, sku: true, unit_of_measure: true } } },
      orderBy: { product: { name: 'asc' } },
    });
    return contents.map(cc => ({ id: cc.id, quantity: cc.quantity, product: cc.product }));
  }

  async addProductToCell(cellId: string, productId: string, quantity: number, userId: string): Promise<CellContentDetailed> {
    // ... (код как был)
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive.');
    return this.prisma.$transaction(async (tx) => {
      const cell = await tx.storageCell.findUnique({ where: { id: cellId } });
      if (!cell || !cell.is_active) throw new NotFoundException(`Storage cell ID "${cellId}" not found or not active.`);
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
          storage_cell_id: cellId, user_id: userId, reason: `Manual addition of ${product.name} to cell ${cell.code}`,
          occurred_at: new Date(),
        }
      });
      return { id: updatedOrCreatedCellContent.id, quantity: updatedOrCreatedCellContent.quantity, product: updatedOrCreatedCellContent.product };
    });
  }

  async updateProductQuantityInCell(
    cellContentId: string,
    newQuantity: number,
    userId: string,
  ): Promise<CellContentDetailed | null> {
    // ... (код как был, он уже обрабатывает newQuantity = 0 как удаление)
    if (newQuantity < 0) {
      throw new BadRequestException('New quantity cannot be negative.');
    }
    return this.prisma.$transaction(async (tx) => {
      const currentContent = await tx.cellContent.findUnique({
        where: { id: cellContentId },
        include: { product: true, storage_cell: true },
      });
      if (!currentContent) {
        throw new NotFoundException(`Content item with ID "${cellContentId}" not found.`);
      }
      const quantityChange = newQuantity - currentContent.quantity;
      if (quantityChange === 0) {
        return { id: currentContent.id, quantity: currentContent.quantity, product: {id: currentContent.product.id, name: currentContent.product.name, sku: currentContent.product.sku, unit_of_measure: currentContent.product.unit_of_measure, } };
      }
      if (newQuantity > currentContent.quantity) {
          const cell = currentContent.storage_cell;
          const cellContents = await tx.cellContent.findMany({ where: { storage_cell_id: cell.id } });
          const otherItemsOccupancy = cellContents.filter(cc => cc.id !== cellContentId).reduce((sum, content) => sum + content.quantity, 0);
          if (otherItemsOccupancy + newQuantity > cell.max_items_capacity) {
              throw new ConflictException(`Not enough capacity in cell "${cell.code}". Occupied by other items: ${otherItemsOccupancy}, New quantity for this item: ${newQuantity}, Cell Capacity: ${cell.max_items_capacity}.`);
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
          product_id: currentContent.product_id, quantity_changed: quantityChange, type: quantityChange > 0 ? 'ADJUSTMENT_PLUS' : 'ADJUSTMENT_MINUS',
          storage_cell_id: currentContent.storage_cell_id, user_id: userId,
          reason: `Quantity for ${currentContent.product.name} in cell ${currentContent.storage_cell.code} changed from ${currentContent.quantity} to ${newQuantity}`,
          occurred_at: new Date(),
        },
      });
      return updatedContentResult;
    });
  }

  // Метод removeProductFromCell БОЛЬШЕ НЕ НУЖЕН, если мы используем updateProductQuantityInCell с quantity = 0
}