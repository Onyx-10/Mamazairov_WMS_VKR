// frontend/src/App.tsx
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'; // Пример
import LoginPage from './pages/LoginPage'; // Предполагаем, что такой файл/компонент будет
// import UsersPage from './pages/UsersPage';
// import ProductsPage from './pages/ProductsPage';
// import StorageCellsPage from './pages/StorageCellsPage';
// import AppLayout from './layouts/AppLayout'; // Макет для защищенных страниц

// TODO: Создать компонент PrivateRoute для защиты роутов
// const PrivateRoute = ({ children }: { children: JSX.Element }) => {
//   const isAuthenticated = !!localStorage.getItem('accessToken'); // Простая проверка, лучше через AuthContext
//   return isAuthenticated ? children : <Navigate to="/login" replace />;
// };

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Пример защищенного роута (пока без AppLayout и PrivateRoute) */}
        <Route 
          path="/dashboard" 
          element={
            // <PrivateRoute>
              <DashboardPage />
            // </PrivateRoute>
          } 
        />
        {/* 
        <Route 
          path="/users" 
          element={
            <PrivateRoute>
              <AppLayout><UsersPage /></AppLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/products" 
          element={
            <PrivateRoute>
              <AppLayout><ProductsPage /></AppLayout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/storage-cells" 
          element={
            <PrivateRoute>
              <AppLayout><StorageCellsPage /></AppLayout>
            </PrivateRoute>
          } 
        />
        */}

        {/* Редирект на дашборд, если пользователь уже вошел, или на логин, если нет */}
        {/* Для этого нужна логика проверки аутентификации */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} /> {/* Или to="/login" */}
        
        {/* Можно добавить страницу 404 Not Found */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;