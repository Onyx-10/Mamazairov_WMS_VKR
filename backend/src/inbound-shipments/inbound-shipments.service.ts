import {
	BadRequestException,
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InboundShipment, Prisma, ShipmentStatus } from '@prisma/client'; // User, Product убраны, т.к. не используются как типы напрямую в этом файле
import { PrismaService } from '../prisma/prisma.service'
import { AddInboundShipmentItemDto } from './dto/add-inbound-shipment-item.dto'
import { CreateInboundShipmentDto } from './dto/create-inbound-shipment.dto'
import { UpdateInboundShipmentItemDto } from './dto/update-inbound-shipment-item.dto'

@Injectable()
export class InboundShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // === Операции с "шапкой" документа приемки ===

  async createShipment(
    createInboundShipmentDto: CreateInboundShipmentDto,
    userId: string,
  ): Promise<InboundShipment> {
    const { document_number, supplier_id, expected_date, notes } = createInboundShipmentDto;

    const existingShipment = await this.prisma.inboundShipment.findUnique({
      where: { document_number },
    });
    if (existingShipment) {
      throw new ConflictException(
        `Inbound shipment with document number "${document_number}" already exists.`,
      );
    }

    if (supplier_id) {
      const supplier = await this.prisma.supplier.findUnique({ where: { id: supplier_id } });
      if (!supplier) {
        throw new BadRequestException(`Supplier with ID "${supplier_id}" not found.`);
      }
    }

    try {
      const dataToCreate: Prisma.InboundShipmentCreateInput = {
        document_number,
        expected_date: expected_date, // DTO уже должен передать Date или undefined
        notes,
        created_by: { connect: { id: userId } }, // Явное подключение пользователя
        status: ShipmentStatus.PLANNED,
      };

      if (supplier_id) {
        dataToCreate.supplier = { connect: { id: supplier_id } };
      }

      return this.prisma.inboundShipment.create({
        data: dataToCreate,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Inbound shipment document number "${document_number}" conflict.`);
      }
      // Логирование ошибки здесь было бы полезно
      console.error('Error creating inbound shipment:', error);
      throw new InternalServerErrorException('Could not create inbound shipment.');
    }
  }

  async findAllShipments(): Promise<InboundShipment[]> {
    return this.prisma.inboundShipment.findMany({
      include: {
        supplier: true,
        created_by: { select: { id: true, username: true, full_name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            target_storage_cell: { select: { id: true, code: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOneShipmentById(id: string): Promise<InboundShipment | null> {
    return this.prisma.inboundShipment.findUnique({
      where: { id },
      include: {
        supplier: true,
        created_by: { select: { id: true, username: true, full_name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit_of_measure: true } },
            target_storage_cell: { select: { id: true, code: true } },
          },
        },
      },
    });
  }

  // === Операции с позициями (items) документа приемки ===

  async addItemToShipment(
    shipmentId: string,
    addItemDto: AddInboundShipmentItemDto,
  ): Promise<InboundShipment> { // Возвращаем InboundShipment, т.к. после успешного действия он точно будет
    const { product_id, quantity_expected, quantity_received, purchase_price_at_receipt } = addItemDto;

    const shipment = await this.prisma.inboundShipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundException(`Inbound shipment with ID "${shipmentId}" not found.`);
    }
    if (shipment.status === ShipmentStatus.COMPLETED || shipment.status === ShipmentStatus.CANCELLED) {
      throw new BadRequestException(`Cannot add items to a shipment with status "${shipment.status}".`);
    }

    const product = await this.prisma.product.findUnique({ where: { id: product_id } });
    if (!product) {
      throw new BadRequestException(`Product with ID "${product_id}" not found.`);
    }

    try {
      await this.prisma.inboundShipmentItem.create({
        data: {
          inbound_shipment_id: shipmentId,
          product_id,
          quantity_expected,
          quantity_received: quantity_received !== undefined ? quantity_received : quantity_expected,
          purchase_price_at_receipt,
        },
      });

      if (shipment.status === ShipmentStatus.PLANNED) {
        await this.prisma.inboundShipment.update({
          where: { id: shipmentId },
          data: { status: ShipmentStatus.IN_PROGRESS },
        });
      }

      const updatedShipment = await this.findOneShipmentById(shipmentId);
      if (!updatedShipment) {
        // Эта ситуация не должна произойти, если логика выше верна
        throw new InternalServerErrorException(`Shipment ${shipmentId} not found after item operation.`);
      }
      return updatedShipment;
    } catch (error) {
      console.error('Error adding item to inbound shipment:', error);
      throw new InternalServerErrorException('Could not add item to inbound shipment.');
    }
  }

  async updateShipmentItem(
    shipmentId: string,
    itemId: string,
    updateItemDto: UpdateInboundShipmentItemDto,
  ): Promise<InboundShipment> { // Возвращаем InboundShipment
    const shipment = await this.prisma.inboundShipment.findUnique({
      where: { id: shipmentId },
      include: { items: { where: { id: itemId } } },
    });

    if (!shipment) {
      throw new NotFoundException(`Inbound shipment with ID "${shipmentId}" not found.`);
    }
    if (shipment.status === ShipmentStatus.COMPLETED || shipment.status === ShipmentStatus.CANCELLED) {
      throw new BadRequestException(`Cannot update items in a shipment with status "${shipment.status}".`);
    }
    if (!shipment.items || shipment.items.length === 0) {
      throw new NotFoundException(`Item with ID "${itemId}" not found in shipment "${shipmentId}".`);
    }

    const { product_id, ...dataToUpdate } = updateItemDto;
    if (product_id && product_id !== shipment.items[0].product_id) {
      throw new BadRequestException('Cannot change product_id of an existing item. Delete and add a new one.');
    }

    try {
      await this.prisma.inboundShipmentItem.update({
        where: { id: itemId },
        data: dataToUpdate, // target_storage_cell_id, quantity_received, purchase_price_at_receipt
      });
      const updatedShipment = await this.findOneShipmentById(shipmentId);
      if (!updatedShipment) {
        throw new InternalServerErrorException(`Shipment ${shipmentId} not found after updating item.`);
      }
      return updatedShipment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Item with ID "${itemId}" not found for update.`);
      }
      console.error('Error updating inbound shipment item:', error);
      throw new InternalServerErrorException('Could not update inbound shipment item.');
    }
  }

  async removeShipmentItem(shipmentId: string, itemId: string): Promise<InboundShipment> { // Возвращаем InboundShipment
    const shipment = await this.prisma.inboundShipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundException(`Inbound shipment with ID "${shipmentId}" not found.`);
    }
    if (shipment.status === ShipmentStatus.COMPLETED || shipment.status === ShipmentStatus.CANCELLED) {
      throw new BadRequestException(`Cannot remove items from a shipment with status "${shipment.status}".`);
    }

    try {
      await this.prisma.inboundShipmentItem.delete({
        where: { id: itemId },
      });
      const updatedShipment = await this.findOneShipmentById(shipmentId);
      if (!updatedShipment) {
        // Теоретически, если приемка еще существует, она должна найтись.
        // Если нет, это означает, что findOneShipmentById вернул null, что странно после delete item,
        // если только удаление последнего элемента не удаляет сам shipment (что не так в нашей логике).
        throw new InternalServerErrorException(`Shipment ${shipmentId} not found after removing item.`);
      }
      return updatedShipment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Item with ID "${itemId}" not found for deletion.`);
      }
      console.error('Error removing inbound shipment item:', error);
      throw new InternalServerErrorException('Could not remove inbound shipment item.');
    }
  }

  // === Часть 2: Завершение приемки и оприходование товаров ===
  async processReceipt(
    shipmentId: string,
    userId: string,
  ): Promise<InboundShipment> {
    return this.prisma.$transaction(async (tx) => { // Используем tx вместо this.prisma внутри транзакции
      const shipment = await tx.inboundShipment.findUnique({
        where: { id: shipmentId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!shipment) {
        throw new NotFoundException(`Inbound shipment with ID "${shipmentId}" not found.`);
      }

      if (shipment.status !== ShipmentStatus.IN_PROGRESS && shipment.status !== ShipmentStatus.PLANNED) {
        throw new BadRequestException(
          `Shipment must be in PLANNED or IN_PROGRESS status to be processed. Current status: ${shipment.status}`,
        );
      }
      if (shipment.items.length === 0) {
        throw new BadRequestException('Cannot process an empty shipment. Add items first.');
      }

      for (const item of shipment.items) {
        if (item.quantity_received === null || item.quantity_received <= 0) {
          if (item.quantity_received === null) { // Если null, то ставим 0, чтобы корректно отразить "не получено"
            await tx.inboundShipmentItem.update({
              where: { id: item.id },
              data: { quantity_received: 0 },
            });
          }
          continue; // Пропускаем дальнейшую обработку этой позиции
        }

        if (!item.target_storage_cell_id) {
          throw new BadRequestException(
            `Target storage cell is not specified for item "${item.product.name}" (SKU: ${item.product.sku}). Please update the item.`,
          );
        }

        const storageCell = await tx.storageCell.findUnique({
          where: { id: item.target_storage_cell_id },
        });
        if (!storageCell || !storageCell.is_active) {
          throw new BadRequestException(
            `Target storage cell ID "${item.target_storage_cell_id}" for item "${item.product.name}" is invalid or not active.`,
          );
        }

        // Проверка вместимости
        const cellContents = await tx.cellContent.findMany({
          where: { storage_cell_id: storageCell.id },
        });
        const currentOccupancy = cellContents.reduce((sum, content) => sum + content.quantity, 0);
        if (currentOccupancy + item.quantity_received > storageCell.max_items_capacity) {
          throw new BadRequestException(
            `Not enough capacity in cell "${storageCell.code}" for item "${item.product.name}". ` +
            `Required: ${item.quantity_received}, Current: ${currentOccupancy}, Capacity: ${storageCell.max_items_capacity}, Available: ${storageCell.max_items_capacity - currentOccupancy}.`,
          );
        }

        const existingCellContent = await tx.cellContent.findUnique({
          where: {
            product_id_storage_cell_id: {
              product_id: item.product_id,
              storage_cell_id: item.target_storage_cell_id,
            },
          },
        });

        if (existingCellContent) {
          await tx.cellContent.update({
            where: { id: existingCellContent.id },
            data: { quantity: { increment: item.quantity_received } },
          });
        } else {
          await tx.cellContent.create({
            data: {
              product_id: item.product_id,
              storage_cell_id: item.target_storage_cell_id,
              quantity: item.quantity_received,
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            product_id: item.product_id,
            quantity_changed: item.quantity_received,
            type: 'RECEIPT',
            storage_cell_id: item.target_storage_cell_id,
            user_id: userId,
            inbound_shipment_item_id: item.id,
            occurred_at: new Date(),
          },
        });
      } // Конец цикла for

      const updatedShipment = await tx.inboundShipment.update({
        where: { id: shipmentId },
        data: {
          status: ShipmentStatus.COMPLETED,
          actual_receipt_date: new Date(),
        },
        include: { // Возвращаем обновленную приемку со всеми деталями
          supplier: true,
          created_by: { select: { id: true, username: true, full_name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, unit_of_measure: true } },
              target_storage_cell: { select: { id: true, code: true } },
            },
          },
        },
      });

      return updatedShipment;
    },
    {
      maxWait: 10000, // Увеличим таймауты для потенциально длинных транзакций
      timeout: 15000,
    });
  }
}

