// frontend/src/api/productService.ts
import type {
	CreateProductDtoFE,
	Product, // DTO для создания
	UpdateProductDtoFE // DTO для обновления
} from '../types/entities'; // Убедись, что эти типы определены в types/entities.ts
import apiClient from './apiClient'

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    // Backend должен вернуть продукты со связанными category и supplier
    const response = await apiClient.get<Product[]>('/products'); 
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
};

export const createProductApi = async (productData: CreateProductDtoFE): Promise<Product> => {
  try {
    const response = await apiClient.post<Product>('/products', productData);
    return response.data;
  } catch (error) {
    console.error("Failed to create product:", error);
    throw error;
  }
};

export const updateProductApi = async (productId: string, productData: UpdateProductDtoFE): Promise<Product> => {
  try {
    const response = await apiClient.patch<Product>(`/products/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update product ${productId}:`, error);
    throw error;
  }
};

export const deleteProductApi = async (productId: string): Promise<void> => {
  try {
    await apiClient.delete(`/products/${productId}`);
  } catch (error) {
    console.error(`Failed to delete product ${productId}:`, error);
    throw error;
  }
};