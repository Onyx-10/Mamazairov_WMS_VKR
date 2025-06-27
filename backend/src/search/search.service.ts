// search.service.ts

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(term: string) {
    if (!term || term.trim().length < 2) {
      return [];
    }

    // 1. Поиск по товарам с включением данных о местоположении
    const productsFromDb = await this.prisma.product.findMany({
      where: {
        OR: [
          { name:        { contains: term, mode: 'insensitive' } },
          { sku:         { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        sku: true,
        cell_contents: {
          where: {
            // ИСПРАВЛЕНО: `storageCell` заменено на `storage_cell`
            storage_cell: { is_active: true }
          },
          select: {
            // ИСПРАВЛЕНО: `storageCell` заменено на `storage_cell`
            storage_cell: {
              select: {
                code: true
              }
            }
          }
        }
      },
      take: 10,
    });

    // 2. Форматируем товары для ответа, добавляя поле `locations`
    const products = productsFromDb.map(p => {
      const locations = p.cell_contents.map(content => ({
        // ИСПРАВЛЕНО: `content.storageCell` заменено на `content.storage_cell`
        code: content.storage_cell.code
      }));

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        type: 'product' as const,
        locations: locations,
      };
    });
    
    // Поиск по ячейкам
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

    // Формируем финальный результат
    const results = [
      ...products,
      ...storageCells.map(sc => ({ ...sc, type: 'storage-cell' as const })),
    ];
    
    return results;
  }
}