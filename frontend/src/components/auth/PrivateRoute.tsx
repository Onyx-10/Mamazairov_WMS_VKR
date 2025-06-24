// frontend/src/components/auth/PrivateRoute.tsx
import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'; // Проверь правильность пути

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Пока AuthContext проверяет токен (начальная загрузка), показываем лоадер
    // Это предотвратит мигание или преждевременный редирект на /login
    return <div>Loading authentication state...</div>; // Можешь использовать свой компонент-спиннер
  }

  if (!isAuthenticated) {
    // Если пользователь не аутентифицирован (и загрузка завершена),
    // перенаправляем на страницу входа.
    // Сохраняем текущий путь (location) в state, чтобы после логина
    // можно было вернуться на страницу, которую пользователь изначально запрашивал.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если пользователь аутентифицирован (и загрузка завершена),
  // рендерим дочерний компонент (защищенную страницу) через <Outlet />
  return <Outlet />;
};

export default PrivateRoute;