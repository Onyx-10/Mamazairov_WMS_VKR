// frontend/src/types/auth.ts (пример)
export enum UserRole { // Можно продублировать enum с бэкенда или получать его как строку
    MANAGER = 'MANAGER',
    WAREHOUSE_KEEPER = 'WAREHOUSE_KEEPER',
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

export interface UserProfile {
  id: string;
  username: string;
  role: UserRole; // Используем enum
  full_name?: string;
  is_active?: boolean;
  // Добавь другие поля, которые возвращает твой /auth/profile эндпоинт
}