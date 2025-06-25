import '@ant-design/v5-patch-for-react-19'
import 'antd/dist/reset.css'; // <--- ИМПОРТ СТИЛЕЙ ANT DESIGN (для v5+)
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'; // Твои глобальные стили, если есть

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);