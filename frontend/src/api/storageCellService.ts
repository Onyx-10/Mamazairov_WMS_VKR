// frontend/src/api/storageCellService.ts
import type { CellContentDetailedItem, StorageCell } from '../types/entities'
import apiClient from './apiClient'

// DTO для добавления товара, как его ожидает backend
interface AddProductToCellPayloadBE { // BE - Backend
  productId: string;
  quantity: number;
}

// DTO для обновления количества, как его ожидает backend
interface UpdateCellContentQuantityPayloadBE { // BE - Backend
  quantity: number;
}


export const fetchStorageCells = async (): Promise<StorageCell[]> => {
  try {
    const response = await apiClient.get<StorageCell[]>('/storage-cells');
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch storage cells:", error);
    throw error;
  }
};

export const fetchCellContents = async (cellId: string): Promise<CellContentDetailedItem[]> => {
  try {
    const response = await apiClient.get<CellContentDetailedItem[]>(`/storage-cells/${cellId}/contents`);
    return response.data || [];
  } catch (error) {
    console.error(`Failed to fetch contents for cell ${cellId}:`, error);
    throw error;
  }
};

export const addProductToCellApi = async ( // Переименовал, чтобы не конфликтовать с импортом из другого места, если есть
  cellId: string,
  payload: AddProductToCellPayloadBE,
): Promise<CellContentDetailedItem> => {
  try {
    const response = await apiClient.post<CellContentDetailedItem>(`/storage-cells/${cellId}/contents`, payload);
    return response.data;
  } catch (error) {
    console.error(`Failed to add product to cell ${cellId}:`, error);
    throw error;
  }
};

// Обновление количества товара в ячейке (включая удаление, если quantity = 0)
export const updateProductQuantityInCellApi = async ( // Переименовал
  cellContentId: string, // ID записи CellContent
  payload: UpdateCellContentQuantityPayloadBE,
): Promise<CellContentDetailedItem | null> => { // Backend может вернуть null, если запись удалена
  try {
    const response = await apiClient.patch<CellContentDetailedItem | null>(`/storage-cells/contents/${cellContentId}/quantity`, payload);
    return response.data;
  } catch (error) {
    console.error(`Failed to update product quantity for content ${cellContentId}:`, error);
    throw error;
  }
};