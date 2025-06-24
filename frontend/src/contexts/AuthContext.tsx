import type { ReactNode } from 'react'; // <--- ИСПРАВЛЕННЫЙ ИМПОРТ
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchUserProfile as apiFetchUserProfile, loginUser as apiLoginUser, logoutUser as apiLogoutUser } from '../api/authService'
import type { LoginCredentials, UserProfile } from '../types/auth'; // Убедись, что эти импорты тоже type-only

// Убедись, что UserProfile и другие типы здесь

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean; // Состояние начальной загрузки/проверки токена
  authError: string | null; // Ошибки аутентификации
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [loading, setLoading] = useState<boolean>(true); // Изначально true, пока проверяем токен
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const attemptAutoLogin = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        setToken(storedToken); // Установим токен в состояние, apiClient его подхватит
        try {
          const userProfile = await apiFetchUserProfile(); // authService сохранит в localStorage
          setUser(userProfile);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auto login failed:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setToken(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false); // Завершили попытку авто-логина
    };

    attemptAutoLogin();
  }, []); // Пустой массив зависимостей - выполнится один раз при монтировании

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setAuthError(null);
    try {
      await apiLoginUser(credentials); // Сохраняет токен в localStorage
      const userProfile = await apiFetchUserProfile(); // Получает и сохраняет пользователя
      
      setToken(localStorage.getItem('accessToken'));
      setUser(userProfile);
      setIsAuthenticated(true);
      setLoading(false);
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Login context error:', error);
      localStorage.removeItem('accessToken'); // Очистка на случай частичного успеха
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      if (error.response && error.response.data && typeof error.response.data.message === 'string') {
        setAuthError(error.response.data.message);
      } else if (typeof error.message === 'string') {
        setAuthError(error.message);
      } else {
        setAuthError('Login failed. Please check your credentials.');
      }
      setLoading(false);
      // Не нужно здесь вызывать navigate, ошибка будет отображена на LoginPage
      throw error; // Перебрасываем ошибку, чтобы LoginPage мог ее поймать
    }
  };

  const logout = () => {
    apiLogoutUser(); // Удаляет из localStorage и делает window.location.href = '/login'
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    // apiLogoutUser уже делает редирект, но если бы не делал:
    // navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, loading, authError }}>
      {!loading && children} {/* Показываем дочерние компоненты только после завершения начальной загрузки */}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};