import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

// URL твоего backend API (возьми из переменных окружения Vite, если настроено, или захардкодь для начала)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'; // Убедись, что порт совпадает

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления JWT токена в заголовки
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken'); // Или из другого хранилища
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    // Здесь можно добавить логирование ошибки, если нужно
    // console.error('Request error:', error);
    return Promise.reject(error);
  },
);

// Интерцептор для обработки ответов (например, для автоматического выхода при 401)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response, // <--- ЯВНО УКАЗАН ТИП AxiosResponse
  (error: AxiosError) => {
    // console.error('Response error:', error.config, error.response?.status, error.message); // Для отладки
    if (error.response && error.response.status === 401) {
      // Токен невалиден или истек
      // Можно добавить проверку, чтобы не редиректить, если это была ошибка на самом /login эндпоинте
      // if (error.config && !error.config.url?.endsWith('/auth/login')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // Перенаправляем на страницу входа
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'; // Простая перезагрузка и редирект
      }
      // }
    }
    return Promise.reject(error);
  },
);

export default apiClient;