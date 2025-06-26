// frontend/src/types/entities.ts

// =================================================================
// --- Глобальные и Вспомогательные Типы ---
// =================================================================

export enum UserRole {
  MANAGER = 'MANAGER',
  WAREHOUSE_KEEPER = 'WAREHOUSE_KEEPER',
}

// =================================================================
// --- Пользователи (Users) ---
// =================================================================

export interface UserListItem {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string; 
  updated_at: string; 
}

export interface CreateUserDtoFE {
  username: string;
  password?: string;
  full_name: string;
  role: UserRole;
  is_active?: boolean;
}

export interface UpdateUserDtoFE {
  username?: string; 
  password?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}


// =================================================================
// --- Справочники (Категории, Поставщики) ---
// =================================================================

export interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}


// =================================================================
// --- Товары (Products) ---
// =================================================================

export interface ProductBasicInfo {
  id: string;
  name: string;
  sku: string;
  unit_of_measure?: string;
}

export interface Product extends ProductBasicInfo {
  description?: string | null;
  purchase_price?: number | null; // Prisma Decimal -> number
  min_stock_level?: number | null;
  max_stock_level?: number | null;
  category?: ProductCategory | null; // Вложенный объект
  supplier?: Supplier | null;     // Вложенный объект
  created_at: string;
  updated_at: string;
  // Дополнительные поля, если API их возвращает (например, общий остаток)
  total_stock?: number;
}

export interface CreateProductDtoFE {
  name: string;
  sku: string;
  description?: string;
  unit_of_measure: string;
  purchase_price?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  category_id?: string; // При создании/обновлении передаем ID
  supplier_id?: string; // При создании/обновлении передаем ID
}

export interface UpdateProductDtoFE extends Partial<CreateProductDtoFE> {}


// =================================================================
// --- Ячейки и их Содержимое (StorageCells & Contents) ---
// =================================================================

export interface CellContentDetailedItem {
  id: string; // ID записи в таблице CellContent
  quantity: number;
  product: ProductBasicInfo;
}

export interface StorageCell {
  id: string;
  code: string;
  description?: string | null;
  max_items_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_occupancy: number; 
}

export interface CreateStorageCellDtoFE {
  code: string;
  description?: string;
  max_items_capacity: number;
  is_active?: boolean;
}

export interface UpdateStorageCellDtoFE {
  code?: string;
  description?: string;
  max_items_capacity?: number;
  is_active?: boolean;
}

export interface AddProductToCellFormValues {
  productId: string | undefined;
  quantity: number;
}

export interface UpdateCellContentQuantityFormValues {
  quantity: number;
}


// =================================================================
// --- Приемки (Inbound Shipments) ---
// =================================================================

export enum ShipmentStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface InboundShipmentItem {
  id: string;
  quantity_expected: number;
  quantity_received: number;
  purchase_price_at_receipt?: number | null;
  product: ProductBasicInfo;
  target_storage_cell?: { id: string; code: string } | null;
}

export interface InboundShipment {
  id: string;
  document_number: string;
  status: ShipmentStatus;
  expected_date?: string | null;
  actual_receipt_date?: string | null;
  notes?: string | null;
  supplier?: Supplier | null;
  created_by: { username: string; full_name: string };
  created_at: string;
  updated_at: string;
  items: InboundShipmentItem[];
}

export interface CreateInboundShipmentDtoFE {
  document_number: string;
  expected_date?: string; // или Date
  supplier_id?: string;
  notes?: string;
}

export interface AddInboundShipmentItemDtoFE {
  product_id: string;
  quantity_expected: number;
  quantity_received?: number;
  purchase_price_at_receipt?: number;
}

export interface UpdateInboundShipmentItemDtoFE {
  quantity_expected?: number;
  quantity_received?: number;
  purchase_price_at_receipt?: number;
  target_storage_cell_id?: string; // Для указания ячейки перед оприходованием
}


// =================================================================
// --- Отгрузки (Outbound Shipments) ---
// =================================================================

export enum OrderStatus {
  NEW = 'NEW',
  PENDING_ASSEMBLY = 'PENDING_ASSEMBLY',
  ASSEMBLING = 'ASSEMBLING',
  READY_FOR_SHIPMENT = 'READY_FOR_SHIPMENT',
  SHIPPED = 'SHIPPED',
  CANCELLED = 'CANCELLED',
}

export interface OutboundShipmentItem {
  id: string;
  quantity_ordered: number;
  quantity_shipped: number;
  selling_price_at_shipment?: number | null;
  product: ProductBasicInfo;
}

export interface OutboundShipment {
  id: string;
  document_number: string;
  customer_details?: string | null;
  status: OrderStatus;
  planned_shipping_date?: string | null;
  actual_shipping_date?: string | null;
  notes?: string | null;
  created_by: { username: string; full_name: string };
  created_at: string;
  updated_at: string;
  items: OutboundShipmentItem[];
}

export interface CreateOutboundShipmentDtoFE {
  document_number: string;
  customer_details?: string;
  planned_shipping_date?: string; // или Date
  notes?: string;
}

export interface AddOutboundShipmentItemDtoFE {
  product_id: string;
  quantity_ordered: number;
  selling_price_at_shipment?: number;
}

export interface UpdateOutboundShipmentItemDtoFE {
  quantity_ordered?: number;
  selling_price_at_shipment?: number;
  // quantity_shipped обычно обновляется сервером при обработке
}


// =================================================================
// --- Прочее (Поиск, Аутентификация) ---
// =================================================================

export type SearchResultItem = ProductSearchResult | StorageCellSearchResult;
export interface ProductSearchResult { id: string; name: string; sku: string; type: 'product'; locations?: { code: string; cellId: string }[]; }
export interface StorageCellSearchResult { id: string; code: string; description?: string | null; type: 'storage-cell'; contents?: { name: string; productId: string; quantity: number }[]; }

export interface LoginCredentials { username: string; password: string; }
export interface AuthResponse { access_token: string; }
export type UserProfile = UserListItem; // Профиль пользователя = элементу списка