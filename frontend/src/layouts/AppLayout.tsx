
  // frontend/src/layouts/AppLayout.tsx
import {
  AppstoreOutlined,
  DashboardOutlined, // Для товаров, например
  GoldOutlined, // Для профиля или пользователей
  LogoutOutlined, // Для ячеек, например
  UserOutlined, // Для профиля или пользователей
} from '@ant-design/icons'
import { Avatar, Button, Layout, Menu, Space, Typography } from 'antd'; // Импортируем компоненты AntD
import type { ReactNode } from 'react'; // Используем import type для ReactNode
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'; // Убедись, что путь правильный

const { Header, Content, Footer, Sider } = Layout; // Деструктурируем компоненты Layout
const { Title } = Typography;

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Если пользователь не аутентифицирован, не рендерим layout
  // PrivateRoute уже должен был сделать редирект на /login
  if (!isAuthenticated) {
    // Можно вернуть null или специфический компонент/редирект,
    // но обычно PrivateRoute не допустит сюда неаутентифицированного пользователя.
    return null; 
  }

  const handleLogout = () => {
    logout(); // logout из AuthContext уже делает редирект на /login
  };

  // Определение пунктов меню в зависимости от роли пользователя
  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: <Link to="/dashboard">Dashboard</Link>,
      },
      {
        key: '/products',
        icon: <AppstoreOutlined />,
        label: <Link to="/products">Товары</Link>,
      },
      {
        key: '/storage-cells',
        icon: <GoldOutlined />,
        label: <Link to="/storage-cells">Ячейки</Link>,
      },
      // Добавь сюда другие общие пункты меню
    ];

    if (user?.role === 'MANAGER') {
      items.push({
        key: '/users', // Пример страницы управления пользователями для менеджера
        icon: <UserOutlined />,
        label: <Link to="/users">Пользователи</Link>,
      });
    }
    return items;
  };

  // Определение текущего активного пункта меню на основе URL
  const selectedKeys = [location.pathname]; // location из react-router-dom (если нужно, можно получить через useLocation)
                                         // или можно сделать более сложную логику определения активного ключа

  return (
    <Layout style={{ minHeight: '100vh' }}> {/* Layout занимает всю высоту экрана */}
      <Sider
        breakpoint="lg" // Боковое меню будет скрываться на маленьких экранах
        collapsedWidth="0" // Полностью скрывать при коллапсе (если не нужно состояние "узкого" меню)
        theme="dark" // Темная тема для Sider
        // можно добавить состояние для collapsed и кнопку для сворачивания/разворачивания
      >
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white', borderRadius: '4px' }}>
          WMS Logo
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['/dashboard']} // Пункт по умолчанию
          selectedKeys={selectedKeys} // Активный пункт меню
          items={getMenuItems()}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {/* Здесь может быть кнопка для сворачивания Sider, если он не breakpoint-only */}
            {/* <Title level={4} style={{ margin: 0, display: 'inline-block' }}>Заголовок страницы</Title> */}
          </div>
          <Space align="center">
            {user && <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />}
            {user && <Typography.Text strong style={{marginRight: 16}}>{user.full_name || user.username} ({user.role})</Typography.Text>}
            <Button type="primary" icon={<LogoutOutlined />} onClick={handleLogout} danger>
              Выйти
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 64px - 48px - 69px)' }}> 
            {/* 64px - высота Header, 48px - отступы Content, 69px - высота Footer. 
                Это нужно для того, чтобы Content занимал оставшееся место до Footer.
                Более гибко это делается через Flexbox на родительском Layout, но и так сойдет для начала.
                Или просто minHeight: 360 (стандарт AntD)
            */}
            {children} {/* Здесь будет рендериться содержимое текущей страницы */}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Warehouse Management System ©{new Date().getFullYear()} Created by YourName
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;