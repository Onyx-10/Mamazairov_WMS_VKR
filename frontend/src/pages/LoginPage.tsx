import React from 'react'
import { useNavigate } from 'react-router-dom'; // useNavigate все же нужен для редиректа после логина из AuthContext, если login не делает этого сам. Хотя в нашем AuthContext login делает navigate.
import { useAuth } from '../contexts/AuthContext'

// Импорты из Ant Design
import { LockOutlined, UserOutlined } from '@ant-design/icons'; // Иконки для полей
import { Alert, Button, Card, Col, Form, Input, Row, Spin } from 'antd'

// Стили можно вынести в отдельный CSS-модуль (LoginPage.module.css) или оставить инлайн для простоты
const pageStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh', // На всю высоту экрана
  background: '#f0f2f5', // Светло-серый фон для всей страницы
};

const cardStyles: React.CSSProperties = {
  width: 400, // Ширина карточки с формой
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Небольшая тень
};

// Для красной кнопки можно использовать primary цвет AntD, если он настроен на красный,
// или переопределить стили. Для простоты сейчас сделаем через style.
const loginButtonStyles: React.CSSProperties = {
  background: '#ff4d4f', // Красный цвет
  borderColor: '#ff4d4f',
  // Можно добавить :hover стили через CSS-файл или более сложные CSS-in-JS
};

const LoginPage: React.FC = () => {
  // const [username, setUsername] = useState(''); // AntD Form сам управляет состоянием полей
  // const [password, setPassword] = useState('');
  const { login, loading, authError } = useAuth();
  const navigate = useNavigate(); // Для возможного редиректа, если login из AuthContext не будет этого делать

  const onFinish = async (values: any) => { // values будет содержать { username: '...', password: '...' }
    // console.log('Received values of form: ', values);
    try {
      await login({ username: values.username, password: values.password });
      // Навигация уже встроена в login в AuthContext
      // navigate('/dashboard', { replace: true }); 
    } catch (error) {
      // Ошибка уже обрабатывается в AuthContext и устанавливается в authError
      console.error("Login page submit error (already handled by AuthContext):", error);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col>
        <Card title="Warehouse Login" style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <Spin spinning={loading} tip="Logging in...">
            <Form
              name="login"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
              layout="vertical" // Метки над полями
            >
              {authError && (
                <Form.Item>
                  <Alert message={authError} type="error" showIcon />
                </Form.Item>
              )}

              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: 'Please input your Username!' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Username" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your Password!' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block // Кнопка на всю ширину
                  style={loginButtonStyles} // Применяем красные стили
                  // danger // Альтернатива для красного цвета, если тема AntD это поддерживает
                >
                  Log in
                </Button>
              </Form.Item>
            </Form>
          </Spin>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginPage;