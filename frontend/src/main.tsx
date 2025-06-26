// frontend/src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { ConfigProvider } from 'antd'; // 1. Импортируем ConfigProvider
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// 2. Создаем объект нашей кастомной темы
const customTheme = {
  token: {
    // Устанавливаем основной цвет
    colorPrimary: '#D32F2F',

    // Ant Design автоматически рассчитает цвета для hover и active состояний,
    // но мы можем их переопределить, если нужно.
    // colorPrimaryHover: '#E53935',
    
    // Также можно настроить другие токены
    borderRadius: 8, // Соответствует вашему CSS для нативных кнопок
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif', // Устанавливаем шрифт
  },
  // Вы можете даже настроить алгоритмы для темной/светлой темы
  // algorithm: antdTheme.darkAlgorithm, 
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 3. Оборачиваем все приложение в ConfigProvider и передаем ему тему */}
      <ConfigProvider theme={customTheme}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)