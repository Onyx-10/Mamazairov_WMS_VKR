// frontend/src/api/userService.ts
import type { CreateUserDtoFE, UpdateUserDtoFE, UserListItem } from '../types/entities'; // <--- ПРАВИЛЬНЫЙ ИМПОРТ
import apiClient from './apiClient'

export const fetchUsers = async (): Promise<UserListItem[]> => {
  try {
    const response = await apiClient.get<UserListItem[]>('/users');
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error; // Важно перебрасывать ошибку для обработки в компоненте
  }
};

export const createUserApi = async (userData: CreateUserDtoFE): Promise<UserListItem> => {
  try {
    const response = await apiClient.post<UserListItem>('/users', userData);
    return response.data;
  } catch (error) {
    console.error("Failed to create user:", error);
    throw error;
  }
};

export const updateUserApi = async (userId: string, userData: UpdateUserDtoFE): Promise<UserListItem> => {
  try {
    const response = await apiClient.patch<UserListItem>(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update user ${userId}:`, error);
    throw error;
  }
};

export const deleteUserApi = async (userId: string): Promise<void> => {
  try {
    await apiClient.delete(`/users/${userId}`);
  } catch (error) {
    console.error(`Failed to delete user ${userId}:`, error);
    throw error;
  }
};