import {
  AppstoreOutlined,
  DashboardOutlined,
  GoldOutlined,
  LogoutOutlined,
  MenuOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Drawer, Layout, Menu, Space, Typography } from 'antd'
import type { ReactNode } from 'react'
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const { Header, Content, Footer } = Layout;

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation(); // Для определения активного пункта меню
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);

  if (!isAuthenticated && !user) { // Добавил проверку user для надежности после logout
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => { navigate('/dashboard'); setDrawerVisible(false); },
    },
    {
      key: '/products',
      icon: <AppstoreOutlined />,
      label: 'Товары',
      onClick: () => { navigate('/products'); setDrawerVisible(false); },
    },
    {
      key: '/inbound-shipments',
      icon: <GoldOutlined />,
      label: 'Приёмка',
      onClick: () => { navigate('/inbound-shipments'); setDrawerVisible(false); },
    },
    {
      key: '/outbound-shipments',
      icon: <GoldOutlined />,
      label: 'Отгрузка',
      onClick: () => { navigate('/outbound-shipments'); setDrawerVisible(false); },
    },
  ];

  if (user?.role === 'MANAGER') {
    menuItems.push({
      key: '/users',
      icon: <UserOutlined />,
      label: 'Пользователи',
      onClick: () => { navigate('/users'); setDrawerVisible(false); },
    });
  }

  // Определяем активный ключ для Menu
  // Ищем наиболее специфичный совпадающий путь
  let activeKey = '/dashboard'; // Пункт по умолчанию
  for (const item of menuItems.slice().reverse()) { // Идем с конца для специфичности
      if (location.pathname.startsWith(item.key)) {
          activeKey = item.key;
          break;
      }
  }


  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const onCloseDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 20px', // Уменьшил паддинг для мобильных
          background: '#001529', // Темный фон хедера
          color: 'white',
          position: 'fixed', // Фиксированный хедер
          zIndex: 10, // Чтобы был поверх контента
          width: '100%'
        }}
      >
        {/* Лого и название */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography.Title level={4} style={{ color: 'white', margin: 0, marginRight: '20px' }}>
            WMS
          </Typography.Title>
          {/* Горизонтальное меню для десктопа */}
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[activeKey]}
            items={menuItems}
            style={{ lineHeight: '62px', borderBottom: 'none', flexGrow: 1 }} // Убрал рамку и позволил расти
            className="desktop-menu" // Класс для скрытия на мобильных
          />
        </div>

        {/* Пользователь и кнопка выхода */}
        <Space align="center" className="desktop-usermenu"> {/* Класс для скрытия на мобильных */}
          {user && <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />}
          {user && <Typography.Text style={{ color: 'white', marginRight: 16 }}>{user.full_name || user.username} ({user.role})</Typography.Text>}
          <Button type="primary" icon={<LogoutOutlined />} onClick={handleLogout} danger>
            Выйти
          </Button>
        </Space>
        
        {/* Кнопка-гамбургер для мобильного меню */}
        <Button 
            type="primary" 
            icon={<MenuOutlined />} 
            onClick={showDrawer} 
            className="mobile-menu-button" // Класс для показа только на мобильных
            style={{border: 'none'}}
        />
      </Header>

      {/* Выдвижное боковое меню для мобильных */}
      <Drawer
        title="Меню"
        placement="left"
        onClose={onCloseDrawer}
        open={drawerVisible} // Используем 'open' для AntD v5
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          theme="light" // Можно light или dark
        />
        {/* Можно добавить информацию о пользователе и кнопку выхода и в Drawer */}
         <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', marginTop: 'auto' }}>
            {user && <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />}
            {user && <Typography.Text strong>{user.full_name || user.username}</Typography.Text>}
            <Button type="primary" icon={<LogoutOutlined />} onClick={handleLogout} danger block style={{marginTop: 16}}>
              Выйти
            </Button>
          </div>
      </Drawer>
      
      {/* Основной контент страницы */}
      <Content style={{ 
          padding: '24px', 
          marginTop: '64px', // Отступ от фиксированного хедера
          background: '#f0f2f5' // Фон для области контента
        }}
      >
        <div style={{ background: '#fff', padding: 24, minHeight: 'calc(100vh - 64px - 48px - 69px)' }}>
          {/* (minHeight расчет: 100vh - headerHeight - contentPaddingTopBottom - footerHeight) */}
          {children}
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}> {/* Фон футера */}
        Warehouse Management System ©{new Date().getFullYear()} Created by {user?.full_name || "Kairat E. Mamazairov"}
      </Footer>
    </Layout>
  );
};

export default AppLayout;