// frontend/src/App.tsx
import { Navigate, Route, Routes } from 'react-router-dom'
import PrivateRoute from './components/auth/PrivateRoute'
import { useAuth } from './contexts/AuthContext'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import InboundShipmentsPage from './pages/InboundShipmentsPage'
import LoginPage from './pages/LoginPage'
import OutboundShipmentsPage from './pages/OutboundShipmentsPage'
import ProductsPage from './pages/ProductsPage'; // Создай заглушку пока
import UsersPage from './pages/UsersPage'

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading application state...</div>; // Или глобальный спиннер на весь экран
  }

  return (
    <Routes>
      {/* Публичный роут для страницы входа */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      {/* Защищенные роуты */}
      <Route element={<PrivateRoute />}> {/* Обертка для всех защищенных роутов */}
        <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/products" element={<AppLayout><ProductsPage /></AppLayout>} />
        <Route path="/inbound-shipments" element={<AppLayout><InboundShipmentsPage /></AppLayout>} />
        <Route path="/outbound-shipments" element={<AppLayout><OutboundShipmentsPage /></AppLayout>} />
        <Route path="/users" element={<AppLayout><UsersPage /></AppLayout>} />
        {/* Другие защищенные роуты */}
      </Route>
      
      {/* Корневой путь: если аутентифицирован -> дашборд, иначе -> логин */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />

      {/* Роут для страницы не найдена (404) - можно добавить позже */}
      {/* <Route path="*" element={<AppLayout><NotFoundPage /></AppLayout>} /> */}
    </Routes>
  );
}

export default App;