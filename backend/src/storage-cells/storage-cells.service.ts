// backend/src/storage-cells/storage-cells.service.ts
import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { Prisma, StorageCell } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'; // Убедись, что путь к PrismaService правильный
import { CreateStorageCellDto } from './dto/create-storage-cell.dto'
import { UpdateStorageCellDto } from './dto/update-storage-cell.dto'

@Injectable()
export class StorageCellsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createStorageCellDto: CreateStorageCellDto,
  ): Promise<StorageCell> {
    const { code, description, max_items_capacity, is_active } = createStorageCellDto;

    // Проверка на уникальность кода ячейки
    const existingCell = await this.prisma.storageCell.findUnique({
      where: { code },
    });
    if (existingCell) {
      throw new ConflictException(`Storage cell with code "${code}" already exists.`);
    }

    try {
      return this.prisma.storageCell.create({
        data: {
          code,
          description,
          max_items_capacity,
          is_active: is_active !== undefined ? is_active : true, // Значение по умолчанию, если не передано
        },
      });
    } catch (error) {
      // Логирование ошибки здесь было бы полезно
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Это дублирующая проверка на случай, если гонка состояний произошла между findUnique и create
        throw new ConflictException(`Storage cell with code "${code}" already exists (race condition).`);
      }
      throw new InternalServerErrorException('Could not create storage cell.');
    }
  }

  async findAll(): Promise<StorageCell[]> {
    return this.prisma.storageCell.findMany({
        where: { is_active: true }, // Например, по умолчанию показывать только активные ячейки
                                    // Или добавить параметр для фильтрации
    });
  }

  async findOneById(id: string): Promise<StorageCell | null> {
    const cell = await this.prisma.storageCell.findUnique({
      where: { id },
    });
    // В сервисе лучше просто вернуть null, если не найдено.
    // Контроллер решит, выбрасывать ли NotFoundException.
    return cell;
  }

  async update(
    id: string,
    updateStorageCellDto: UpdateStorageCellDto,
  ): Promise<StorageCell> {
    const { code, ...dataToUpdate } = updateStorageCellDto;

    // Проверяем, существует ли ячейка для обновления
    const existingCell = await this.prisma.storageCell.findUnique({ where: { id } });
    if (!existingCell) {
      throw new NotFoundException(`Storage cell with ID "${id}" not found.`);
    }

    // Если пытаются обновить код ячейки, проверяем его на уникальность
    if (code && code !== existingCell.code) {
      const cellWithNewCode = await this.prisma.storageCell.findUnique({
        where: { code },
      });
      if (cellWithNewCode && cellWithNewCode.id !== id) {
        throw new ConflictException(`Storage cell with code "${code}" already exists.`);
      }
      (dataToUpdate as any).code = code; // Добавляем код в объект для обновления
    }


    try {
      return this.prisma.storageCell.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { // Запись для обновления не найдена
          throw new NotFoundException(`Storage cell with ID "${id}" not found during update.`);
        }
        if (error.code === 'P2002' && code) { // Нарушение уникального ограничения для кода
           throw new ConflictException(`Storage cell with code "${code}" already exists (race condition during update).`);
        }
      }
      // Логирование ошибки
      throw new InternalServerErrorException('Could not update storage cell.');
    }
  }

  async remove(id: string): Promise<StorageCell> {
    try {
      return this.prisma.storageCell.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Storage cell with ID "${id}" not found, cannot delete.`);
      }
      // Также нужно учитывать, что если на ячейку ссылаются другие таблицы
      // (например, CellContents, InboundShipmentItems) и в Prisma schema
      // для этих связей стоит onDelete: Restrict, то удаление будет невозможно,
      // и Prisma выбросит другую ошибку (например, P2003 - Foreign key constraint failed).
      // Эту ошибку здесь нужно будет обработать более специфично, если это требуется.
      // Например, не давать удалять ячейку, если в ней есть товары.

      // Логирование ошибки
      throw new InternalServerErrorException('Could not delete storage cell.');
    }
  }
}