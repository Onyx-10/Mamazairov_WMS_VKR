// backend/src/outbound-shipments/outbound-shipments.service.ts
import {
	BadRequestException,
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { OrderStatus, OutboundShipment, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AddOutboundShipmentItemDto } from './dto/add-outbound-shipment-item.dto'
import { CreateOutboundShipmentDto } from './dto/create-outbound-shipment.dto'
import { UpdateOutboundShipmentItemDto } from './dto/update-outbound-shipment-item.dto'

@Injectable()
export class OutboundShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // === Операции с "шапкой" документа отгрузки ===

  async createShipment(
    createOutboundShipmentDto: CreateOutboundShipmentDto,
    userId: string,
  ): Promise<OutboundShipment> {
    const { document_number, planned_shipping_date, ...shipmentData } = createOutboundShipmentDto;

    const existingShipment = await this.prisma.outboundShipment.findUnique({
      where: { document_number },
    });
    if (existingShipment) {
      throw new ConflictException(
        `Outbound shipment with document number "${document_number}" already exists.`,
      );
    }

    try {
      const dataToCreate: Prisma.OutboundShipmentCreateInput = {
        ...shipmentData, // customer_details, notes
        document_number,
        planned_shipping_date: planned_shipping_date, // DTO уже должен передать Date или undefined
        created_by: { connect: { id: userId } },
        status: OrderStatus.NEW,
      };

      return this.prisma.outboundShipment.create({
        data: dataToCreate,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Outbound shipment document number "${document_number}" conflict.`);
      }
      console.error('Error creating outbound shipment:', error);
      throw new InternalServerErrorException('Could not create outbound shipment.');
    }
  }

  async findAllShipments(): Promise<OutboundShipment[]> {
    return this.prisma.outboundShipment.findMany({
      include: {
        created_by: { select: { id: true, username: true, full_name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOneShipmentById(id: string): Promise<OutboundShipment | null> {
    return this.prisma.outboundShipment.findUnique({
      where: { id },
      include: {
        created_by: { select: { id: true, username: true, full_name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit_of_measure: true } },
          },
        },
      },
    });
  }

  // === Операции с позициями (items) документа отгрузки ===

  async addItemToShipment(
    shipmentId: string,
    addItemDto: AddOutboundShipmentItemDto,
  ): Promise<OutboundShipment> {
    const { product_id, quantity_ordered, selling_price_at_shipment } = addItemDto;

    const shipment = await this.prisma.outboundShipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundException(`Outbound shipment with ID "${shipmentId}" not found.`);
    }
    // Разрешаем добавлять только в определенные статусы
    const modifiableStatuses: OrderStatus[] = [OrderStatus.NEW, OrderStatus.PENDING_ASSEMBLY];
    if (!modifiableStatuses.includes(shipment.status)) {
      throw new BadRequestException(
        `Cannot add items to a shipment with status "${shipment.status}". Allowed statuses: ${modifiableStatuses.join(', ')}.`,
      );
    }

    const product = await this.prisma.product.findUnique({ where: { id: product_id } });
    if (!product) {
      throw new BadRequestException(`Product with ID "${product_id}" not found.`);
    }

    try {
      await this.prisma.outboundShipmentItem.create({
        data: {
          outbound_shipment_id: shipmentId,
          product_id,
          quantity_ordered,
          selling_price_at_shipment,
          quantity_shipped: 0,
        },
      });

      if (shipment.status === OrderStatus.NEW) {
        await this.prisma.outboundShipment.update({
          where: { id: shipmentId },
          data: { status: OrderStatus.PENDING_ASSEMBLY },
        });
      }

      const updatedShipment = await this.findOneShipmentById(shipmentId);
      if (!updatedShipment) {
        throw new InternalServerErrorException(`Shipment ${shipmentId} not found after adding item.`);
      }
      return updatedShipment;
    } catch (error) {
      console.error('Error adding item to outbound shipment:', error);
      throw new InternalServerErrorException('Could not add item to outbound shipment.');
    }
  }

  async updateShipmentItem(
    shipmentId: string,
    itemId: string,
    updateItemDto: UpdateOutboundShipmentItemDto,
  ): Promise<OutboundShipment> {
    const shipment = await this.prisma.outboundShipment.findUnique({
      where: { id: shipmentId },
      include: { items: { where: { id: itemId } } },
    });

    if (!shipment) {
      throw new NotFoundException(`Outbound shipment with ID "${shipmentId}" not found.`);
    }
    const modifiableStatuses: OrderStatus[] = [OrderStatus.NEW, OrderStatus.PENDING_ASSEMBLY, OrderStatus.ASSEMBLING];
    if (!modifiableStatuses.includes(shipment.status)) {
      throw new BadRequestException(
        `Cannot update items in a shipment with status "${shipment.status}". Allowed statuses: ${modifiableStatuses.join(', ')}.`,
      );
    }
    if (!shipment.items || shipment.items.length === 0) {
      throw new NotFoundException(`Item with ID "${itemId}" not found in shipment "${shipmentId}".`);
    }

    const { product_id, ...dataToUpdate } = updateItemDto;
    if (product_id && product_id !== shipment.items[0].product_id) {
      throw new BadRequestException('Cannot change product_id of an existing item. Delete and add a new one.');
    }
    if (dataToUpdate.quantity_ordered !== undefined && shipment.items[0].quantity_shipped > dataToUpdate.quantity_ordered) {
      throw new BadRequestException('Ordered quantity cannot be less than already shipped quantity.');
    }

    try {
      await this.prisma.outboundShipmentItem.update({
        where: { id: itemId },
        data: dataToUpdate,
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
      console.error('Error updating outbound shipment item:', error);
      throw new InternalServerErrorException('Could not update outbound shipment item.');
    }
  }

  async removeShipmentItem(shipmentId: string, itemId: string): Promise<OutboundShipment> {
    const shipment = await this.prisma.outboundShipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      throw new NotFoundException(`Outbound shipment with ID "${shipmentId}" not found.`);
    }
    const modifiableStatuses: OrderStatus[] = [OrderStatus.NEW, OrderStatus.PENDING_ASSEMBLY, OrderStatus.ASSEMBLING];
     if (!modifiableStatuses.includes(shipment.status)) {
      throw new BadRequestException(
        `Cannot remove items from a shipment with status "${shipment.status}". Allowed statuses: ${modifiableStatuses.join(', ')}.`,
      );
    }

    // TODO: Добавить проверку, что quantity_shipped для этого item равно 0, если удаление запрещено после начала отгрузки позиции.

    try {
      await this.prisma.outboundShipmentItem.delete({
        where: { id: itemId },
      });
      const updatedShipment = await this.findOneShipmentById(shipmentId);
      if (!updatedShipment) {
        throw new InternalServerErrorException(`Shipment ${shipmentId} not found after removing item.`);
      }
      return updatedShipment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Item with ID "${itemId}" not found for deletion.`);
      }
      console.error('Error removing outbound shipment item:', error);
      throw new InternalServerErrorException('Could not remove outbound shipment item.');
    }
  }

  // === Часть 2: Завершение отгрузки и списание товаров ===
  async processDispatch(
    shipmentId: string,
    userId: string,
  ): Promise<OutboundShipment> {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.outboundShipment.findUnique({
        where: { id: shipmentId },
        include: { items: { include: { product: true } } },
      });

      if (!shipment) {
        throw new NotFoundException(`Outbound shipment with ID "${shipmentId}" not found.`);
      }

      const dispatchableStatuses: OrderStatus[] = [
        OrderStatus.PENDING_ASSEMBLY,
        OrderStatus.ASSEMBLING,
        OrderStatus.READY_FOR_SHIPMENT,
      ];
      // Исправленная проверка статуса
      if (!dispatchableStatuses.some(s => s === shipment.status)) {
        throw new BadRequestException(
          `Shipment must be in ${dispatchableStatuses.join(' or ')} status to be dispatched. Current status: ${shipment.status}`,
        );
      }
      if (shipment.items.length === 0) {
        throw new BadRequestException('Cannot dispatch an empty shipment.');
      }

      for (const item of shipment.items) {
        let quantityToShipForItem = item.quantity_ordered - item.quantity_shipped;

        if (quantityToShipForItem <= 0) {
          continue;
        }

        const availableCellsWithProduct = await tx.cellContent.findMany({
          where: {
            product_id: item.product_id,
            quantity: { gt: 0 },
            storage_cell: { is_active: true },
          },
          include: { storage_cell: true },
          orderBy: { last_updated_at: 'asc' }, // Простая FIFO-подобная стратегия
        });

        let totalAvailableQuantityForProduct = availableCellsWithProduct.reduce(
          (sum, cellContent) => sum + cellContent.quantity,
          0,
        );

        if (totalAvailableQuantityForProduct < quantityToShipForItem) {
          throw new BadRequestException(
            `Not enough stock for product "${item.product.name}" (SKU: ${item.product.sku}). ` +
            `Required: ${quantityToShipForItem}, Available: ${totalAvailableQuantityForProduct}.`,
          );
        }

        let shippedAmountForThisItemCycle = 0;

        for (const cellContent of availableCellsWithProduct) {
          if (quantityToShipForItem <= 0) break;

          const quantityToTakeFromCell = Math.min(
            cellContent.quantity,
            quantityToShipForItem,
          );

          await tx.cellContent.update({
            where: { id: cellContent.id },
            data: { quantity: { decrement: quantityToTakeFromCell } },
          });

          await tx.stockMovement.create({
            data: {
              product_id: item.product_id,
              quantity_changed: -quantityToTakeFromCell,
              type: 'SHIPMENT',
              storage_cell_id: cellContent.storage_cell_id,
              user_id: userId,
              outbound_shipment_item_id: item.id,
              occurred_at: new Date(),
            },
          });

          quantityToShipForItem -= quantityToTakeFromCell;
          shippedAmountForThisItemCycle += quantityToTakeFromCell;
        }

        if (shippedAmountForThisItemCycle > 0) {
          await tx.outboundShipmentItem.update({
            where: { id: item.id },
            data: { quantity_shipped: { increment: shippedAmountForThisItemCycle } },
          });
        }
      } // Конец цикла по items

      const finalShipmentState = await tx.outboundShipment.findUnique({
        where: { id: shipmentId },
        include: { items: true },
      });

      // Исправленная проверка на null
      if (!finalShipmentState) {
        console.error(`CRITICAL: Shipment ${shipmentId} not found within transaction after item processing.`);
        throw new InternalServerErrorException(`Shipment ${shipmentId} disappeared during transaction. Critical error.`);
      }

      const allItemsFullyShipped = finalShipmentState.items.every(
        (it) => it.quantity_shipped >= it.quantity_ordered,
      );

      if (!allItemsFullyShipped) {
          // Это может случиться, если логика проверки доступности была не совсем точной
          // или произошли параллельные изменения без блокировок.
          // В более сложной системе здесь может быть статус PARTIALLY_SHIPPED
          console.warn(`Shipment ${shipmentId} could not be fully shipped. Check stock levels and item quantities.`);
          throw new BadRequestException(
              `Failed to fully ship all items for shipment ${shipmentId}. Some items may be out of stock or quantities incorrect.`
          );
      }

      const updatedShipment = await tx.outboundShipment.update({
        where: { id: shipmentId },
        data: {
          status: OrderStatus.SHIPPED,
          actual_shipping_date: new Date(),
        },
        include: {
          created_by: { select: { id: true, username: true, full_name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, unit_of_measure: true } },
            },
          },
        },
      });

      return updatedShipment;
    },
    {
      maxWait: 10000,
      timeout: 15000,
    });
  }
}