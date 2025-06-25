import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(term: string) {
    if (!term || term.trim().length < 2) { // Искать от 2 символов
      return { results: [] };
    }

    const searchTerm = `%${term.toLowerCase()}%`; // Для case-insensitive LIKE поиска

    // Поиск по товарам (по имени, SKU, описанию)
    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { name:        { contains: term, mode: 'insensitive' } },
          { sku:         { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, sku: true }, // Выбираем нужные поля
      take: 10, // Ограничиваем количество результатов
    });

    // Поиск по ячейкам (по коду, описанию)
    const storageCells = await this.prisma.storageCell.findMany({
      where: {
        OR: [
          { code:        { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
        is_active: true
      },
      select: { id: true, code: true, description: true },
      take: 10,
    });

    // Формируем результаты с указанием типа
    const results = [
      ...products.map(p => ({ ...p, type: 'product' })),
      ...storageCells.map(sc => ({ ...sc, type: 'storage-cell' })),
    ];
    
    // Можно добавить поиск по содержимому ячеек (найти ячейки, где есть товар X)
    // или товары, которые есть в ячейке с кодом Y - это более сложные запросы.

    return { results };
  }
}