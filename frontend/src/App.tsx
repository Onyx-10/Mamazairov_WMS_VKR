// frontend/src/App.tsx

// Правильные импорты из react-router-dom
import { Navigate, Route, Routes } from 'react-router-dom'

// Импорты страниц
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import ProductsPage from './pages/ProductsPage'
import UsersPage from './pages/UsersPage'
// ИСПРАВЛЕНО: Добавлены импорты для новых страниц приёмки и отгрузки
import InboundShipmentsPage from './pages/InboundShipmentsPage'
import OutboundShipmentsPage from './pages/OutboundShipmentsPage'

// Импорты для аутентификации и макета
import PrivateRoute from './components/auth/PrivateRoute'
import { useAuth } from './contexts/AuthContext'
import AppLayout from './layouts/AppLayout'

function App() {
  const { isAuthenticated, loading } = useAuth();

  // Показываем заглушку, пока проверяется статус аутентификации
  if (loading) {
    // Здесь можно разместить более красивый компонент спиннера
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Загрузка...</div>;
  }

  return (
    <Routes>
      {/* Публичный роут для страницы входа: если пользователь уже вошел, перенаправляем на дашборд */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />

      {/* Группа защищенных роутов, доступных только после входа */}
      <Route element={<PrivateRoute />}>
        {/* Все страницы внутри этой группы будут использовать общий макет AppLayout */}
        <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/products" element={<AppLayout><ProductsPage /></AppLayout>} />
        <Route path="/users" element={<AppLayout><UsersPage /></AppLayout>} />
        
        {/* ИСПРАВЛЕНО: Добавлены маршруты для приёмки и отгрузки */}
        <Route 
          path="/inbound-shipments" 
          element={<AppLayout><InboundShipmentsPage /></AppLayout>} 
        />
        <Route 
          path="/outbound-shipments" 
          element={<AppLayout><OutboundShipmentsPage /></AppLayout>} 
        />
      </Route>
      
      {/* Корневой роут: перенаправляет на дашборд (если вошел) или на страницу логина (если не вошел) */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />
      
      {/* Опционально: роут для страницы "Не найдено" */}
      {/* <Route path="*" element={<AppLayout><NotFoundPage /></AppLayout>} /> */}
    </Routes>
  );
}

export default App;