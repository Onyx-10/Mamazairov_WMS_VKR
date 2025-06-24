// frontend/src/api/authService.ts
import { AuthResponse, LoginCredentials, UserProfile } from '../types/auth'; // Предполагаемые типы
import apiClient from './apiClient'

// Определим типы (можно вынести в отдельный файл, например, src/types/auth.ts)
// export interface LoginCredentials {
//   username: string;
//   password: string;
// }

// export interface AuthResponse {
//   access_token: string;
// }

// export interface UserProfile {
//   id: string;
//   username: string;
//   role: string; // Или UserRole enum, если он будет на фронте
//   full_name?: string;
//   is_active?: boolean;
// }


export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token);
      // Опционально: можно здесь же запросить /auth/profile и сохранить данные пользователя
    }
    return response.data;
  } catch (error) {
    // apiClient интерцептор уже может обработать 401, но здесь можно добавить доп. логику
    console.error("Login failed:", error);
    throw error; // Перебрасываем ошибку для обработки в компоненте
  }
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await apiClient.get<UserProfile>('/auth/profile');
    localStorage.setItem('user', JSON.stringify(response.data)); // Сохраняем профиль
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    throw error;
  }
};

export const logoutUser = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  // Перенаправление на /login
  window.location.href = '/login'; // Опять же, есть более "чистые" способы для SPA
};