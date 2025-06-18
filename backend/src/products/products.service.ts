// backend/src/products/products.service.ts
import {
	BadRequestException,
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { Prisma, Product } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'; // Убедись, что путь правильный
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { sku, category_id, supplier_id, ...productData } = createProductDto;

    // 1. Проверка на уникальность SKU
    const existingProductBySku = await this.prisma.product.findUnique({
      where: { sku },
    });
    if (existingProductBySku) {
      throw new ConflictException(`Product with SKU "${sku}" already exists.`);
    }

    // 2. (Опционально) Проверка существования категории и поставщика, если ID переданы
    if (category_id) {
      const category = await this.prisma.productCategory.findUnique({ where: { id: category_id } });
      if (!category) {
        throw new BadRequestException(`ProductCategory with ID "${category_id}" not found.`);
      }
    }
    if (supplier_id) {
      const supplier = await this.prisma.supplier.findUnique({ where: { id: supplier_id } });
      if (!supplier) {
        throw new BadRequestException(`Supplier with ID "${supplier_id}" not found.`);
      }
    }

    try {
      return this.prisma.product.create({
        data: {
          ...productData,
          sku,
          // Если category_id или supplier_id не предоставлены, они будут null (если поле опционально в схеме)
          // Prisma сама обработает connect, если ID существуют
          ...(category_id && { category: { connect: { id: category_id } } }),
          ...(supplier_id && { supplier: { connect: { id: supplier_id } } }),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Маловероятно, если SKU уже проверен, но на случай гонки
        throw new ConflictException(`Product with SKU "${sku}" already exists (race condition).`);
      }
      // Логирование ошибки
      throw new InternalServerErrorException('Could not create product.');
    }
  }

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      include: { // Включаем связанные данные для отображения
        category: true,
        supplier: true,
      },
    });
  }

  async findOneById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
      },
    });
    return product; // Контроллер обработает NotFoundException, если null
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const { sku, category_id, supplier_id, ...dataToUpdate } = updateProductDto;

    // 1. Проверка, существует ли продукт для обновления
    const existingProduct = await this.prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }

    // 2. Если SKU обновляется, проверяем его на уникальность (кроме текущего продукта)
    if (sku && sku !== existingProduct.sku) {
      const productWithNewSku = await this.prisma.product.findUnique({
        where: { sku },
      });
      if (productWithNewSku && productWithNewSku.id !== id) {
        throw new ConflictException(`Product with SKU "${sku}" already exists.`);
      }
      (dataToUpdate as any).sku = sku; // Добавляем SKU в объект для обновления
    }

    // 3. (Опционально) Проверка существования новой категории и поставщика, если ID переданы
    if (category_id) {
      const category = await this.prisma.productCategory.findUnique({ where: { id: category_id } });
      if (!category) {
        throw new BadRequestException(`ProductCategory with ID "${category_id}" not found for update.`);
      }
    }
    if (supplier_id) {
      const supplier = await this.prisma.supplier.findUnique({ where: { id: supplier_id } });
      if (!supplier) {
        throw new BadRequestException(`Supplier with ID "${supplier_id}" not found for update.`);
      }
    }

    try {
      return this.prisma.product.update({
        where: { id },
        data: {
          ...dataToUpdate,
          ...(sku && { sku: sku }), // Обновляем SKU, если он есть в DTO
          // Обновление связей:
          // Если category_id есть, подключаем новую или отключаем, если null (если возможно)
          ...(category_id !== undefined && { 
            category: category_id ? { connect: { id: category_id } } : { disconnect: true } 
          }),
          ...(supplier_id !== undefined && { 
            supplier: supplier_id ? { connect: { id: supplier_id } } : { disconnect: true }
          }),
        },
        include: { // Возвращаем обновленный продукт со связанными данными
          category: true,
          supplier: true,
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID "${id}" not found during update.`);
        }
        if (error.code === 'P2002' && sku) {
          throw new ConflictException(`Product with SKU "${sku}" already exists (race condition during update).`);
        }
      }
      // Логирование ошибки
      throw new InternalServerErrorException('Could not update product.');
    }
  }

  async remove(id: string): Promise<Product> {
    try {
      return this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Product with ID "${id}" not found, cannot delete.`);
      }
      // Учитывай onDelete правила в Prisma schema для связей (например, с CellContent)
      // Если продукт нельзя удалить из-за внешних ключей, Prisma выдаст P2003.
      // Логирование ошибки
      throw new InternalServerErrorException('Could not delete product.');
    }
  }
}