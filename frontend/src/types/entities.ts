// frontend/src/types/entities.ts

// Enum для ролей, если ты его используешь на фронте.
// Если backend возвращает роль как строку, этот enum может быть не нужен здесь,
// но полезен для консистентности, если ты его импортируешь из общего места или дублируешь.
export enum UserRole {
  MANAGER = 'MANAGER',
  WAREHOUSE_KEEPER = 'WAREHOUSE_KEEPER',
}

export interface ProductBasicInfo {
  id: string;
  name: string;
  sku: string;
  unit_of_measure?: string; // Сделал опциональным, на случай если не всегда приходит
}

export interface CellContentDetailedItem {
  id: string; // ID записи в таблице CellContent
  quantity: number;
  product: ProductBasicInfo; // Вложенный объект с информацией о продукте
}

export interface StorageCell {
  id: string;
  code: string;
  description?: string | null;
  max_items_capacity: number;
  is_active: boolean;
  created_at: string; // или Date
  updated_at: string; // или Date
  current_occupancy: number; // Это поле должен вычислять и возвращать backend
  // cell_contents_detailed не включаем в основной тип StorageCell для списка,
  // а загружаем отдельно для модального окна, чтобы не перегружать список.
}

// DTO для создания ячейки (может дублировать backend DTO или быть упрощенным для формы)
export interface CreateStorageCellDtoFE { // FE - Frontend
  code: string;
  description?: string;
  max_items_capacity: number;
  is_active?: boolean;
}

// DTO для обновления ячейки
export interface UpdateStorageCellDtoFE { // FE - Frontend
  code?: string;
  description?: string;
  max_items_capacity?: number;
  is_active?: boolean;
}

// DTO для добавления продукта в ячейку (для frontend формы)
export interface AddProductToCellFormValues {
  productId: string | undefined; // string, если выбран, undefined - если нет
  quantity: number;
}

// DTO для обновления количества продукта в ячейке (для frontend формы)
export interface UpdateCellContentQuantityFormValues {
    // productId: string | undefined; // Для выбора существующего продукта в ячейке
    // cellContentId: string; // ID записи CellContent, которую обновляем
    quantity: number; // Новое количество
}


// Типы для глобального поиска (если используем поиск)
export interface ProductSearchResult {
  id: string; name: string; sku: string; type: 'product';
  locations?: { code: string; cellId: string }[];
}
export interface StorageCellSearchResult {
  id: string; code: string; description?: string | null; type: 'storage-cell';
  contents?: { name: string; productId: string; quantity: number }[];
}
export type SearchResultItem = ProductSearchResult | StorageCellSearchResult;