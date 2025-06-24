import apiClient from './apiClient'
// Используем 'import type' для импорта только типов
import type { AuthResponse, LoginCredentials, UserProfile } from '../types/auth'

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // Указываем тип ожидаемого ответа для apiClient.post
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (response.data && response.data.access_token) { // Добавил проверку response.data
      localStorage.setItem('accessToken', response.data.access_token);
      // Опционально: можно здесь же запросить /auth/profile и сохранить данные пользователя,
      // но лучше это делать отдельным вызовом после успешного логина в компоненте.
    }
    return response.data;
  } catch (error) {
    // apiClient интерцептор уже может обработать 401, 
    // но здесь можно добавить специфическое логирование для операции логина.
    console.error("Login API call failed:", error); 
    throw error; // Перебрасываем ошибку для обработки в UI-компоненте
  }
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
  try {
    // Указываем тип ожидаемого ответа для apiClient.get
    const response = await apiClient.get<UserProfile>('/auth/profile');
    if (response.data) { // Добавил проверку response.data
      localStorage.setItem('user', JSON.stringify(response.data)); // Сохраняем профиль
    }
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    throw error;
  }
};

export const logoutUser = (): void => { // Явно указал тип возврата void
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  // Перенаправление на /login.
  // Для более "чистого" SPA-перенаправления лучше использовать useNavigate из react-router-dom
  // на уровне компонента или через сервисы навигации, если они есть.
  // Но window.location.href работает, хотя и вызывает полную перезагрузку.
  if (window.location.pathname !== '/login') { // Чтобы избежать цикла редиректов, если уже на /login
      window.location.href = '/login';
  }
};