// frontend/src/pages/UsersPage.tsx
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import {
  Button,
  Empty,
  Form, Input, message, Modal, Popconfirm, Select, Space, Spin, Table, Tag, Tooltip, Typography, // Добавлены Tooltip, Empty, Typography
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useCallback, useEffect, useState } from 'react'
import { createUserApi, deleteUserApi, fetchUsers, updateUserApi } from '../api/userService'
import { useAuth } from '../contexts/AuthContext'
// ИСПРАВЛЕННЫЙ ИМПОРТ: UserRole импортируется как значение, остальное - как типы
import type { CreateUserDtoFE, UpdateUserDtoFE, UserListItem } from '../types/entities'
import { UserRole } from '../types/entities'

const { Title } = Typography;
const { Option } = Select;

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [form] = Form.useForm<CreateUserDtoFE | UpdateUserDtoFE>();

  const loadUsers = useCallback(async () => {
    if (currentUser?.role !== UserRole.MANAGER) { // Используем enum как значение
      setLoading(false);
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      message.error('Не удалось загрузить список пользователей.');
      console.error("Load users error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, role: UserRole.WAREHOUSE_KEEPER }); // Используем enum
    setIsModalVisible(true);
  };

  const showEditModal = (userToEdit: UserListItem) => {
    setEditingUser(userToEdit);
    form.setFieldsValue({
      // username не нужен, так как поле disabled и не отправляется
      full_name: userToEdit.full_name,
      role: userToEdit.role,
      is_active: userToEdit.is_active,
      password: '', // Пароль всегда пустой при открытии формы редактирования
    });
    setIsModalVisible(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (currentUser?.id === userId) {
      message.error("Вы не можете удалить свой собственный аккаунт.");
      return;
    }
    setLoading(true); 
    try {
      await deleteUserApi(userId);
      message.success('Пользователь успешно удален.');
      await loadUsers(); // await, чтобы дождаться обновления списка
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Не удалось удалить пользователя.');
      console.error("Delete user error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: UpdateUserDtoFE) => { // Теперь всегда UpdateUserDtoFE, т.к. username в CreateUserDtoFE обязателен
    setLoading(true);
    try {
      if (editingUser && editingUser.id) { // Редактирование
        const payload: UpdateUserDtoFE = { ...values };
        // username не передаем, т.к. он не редактируется
        if (!values.password || values.password.trim() === '') {
          delete payload.password;
        }
        await updateUserApi(editingUser.id, payload);
        message.success('Данные пользователя успешно обновлены.');
      } else { // Создание
        const createPayload = values as CreateUserDtoFE; // Приводим к типу, который ожидает createUserApi
        if (!createPayload.password || createPayload.password.trim() === '') {
            message.error('Пароль обязателен при создании пользователя.');
            setLoading(false);
            return;
        }
        if (!createPayload.username) {
            message.error('Имя пользователя (логин) обязательно при создании.');
            setLoading(false);
            return;
        }
        await createUserApi(createPayload);
        message.success('Пользователь успешно создан.');
      }
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      await loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || `Не удалось ${editingUser ? 'обновить' : 'создать'} пользователя.`);
      console.error("User form submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<UserListItem> = [
    { title: 'Логин', dataIndex: 'username', key: 'username', sorter: (a, b) => a.username.localeCompare(b.username), ellipsis: true },
    { title: 'Полное имя', dataIndex: 'full_name', key: 'full_name', sorter: (a, b) => (a.full_name || '').localeCompare(b.full_name || ''), ellipsis: true },
    { 
      title: 'Роль', dataIndex: 'role', key: 'role', 
      render: (role: UserRole) => <Tag color={role === UserRole.MANAGER ? 'volcano' : 'geekblue'}>{role}</Tag>, 
      filters: [{text: 'Менеджер', value: UserRole.MANAGER}, {text: 'Кладовщик', value: UserRole.WAREHOUSE_KEEPER}], 
      onFilter: (value, record) => record.role === value, 
    },
    { 
      title: 'Активен', dataIndex: 'is_active', key: 'is_active', 
      render: (isActive: boolean) => isActive ? <Tag color="green">Да</Tag> : <Tag color="red">Нет</Tag>, 
      filters: [{text: 'Да', value: true}, {text: 'Нет', value: false}], 
      onFilter: (value, record) => record.is_active === value, 
    },
    { title: 'Действия', key: 'actions', align: 'center', width: 150,
      render: (_: any, record: UserListItem) => (
        <Space size="small">
          <Tooltip title="Редактировать"><Button shape="circle" icon={<EditOutlined />} onClick={() => showEditModal(record)} /></Tooltip>
          {currentUser?.id !== record.id && (
             <Popconfirm title={`Удалить ${record.username}?`} onConfirm={() => handleDeleteUser(record.id)} okText="Удалить" okType="danger" cancelText="Отмена">
                <Tooltip title="Удалить"><Button shape="circle" danger icon={<DeleteOutlined />} /></Tooltip>
             </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (!loading && currentUser?.role !== 'MANAGER') { 
      return ( <div style={{padding: '50px', textAlign: 'center'}}> <Empty description="У вас нет прав для доступа к этой странице." /> </div> );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Title level={2} style={{ margin: 0 }}>Управление пользователями</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal} disabled={loading} >
          Добавить пользователя
        </Button>
      </div>
      <Spin spinning={loading} tip="Загрузка пользователей...">
        <Table columns={columns} dataSource={users} rowKey="id" bordered size="middle" scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'], showTotal: (total, range) => `${range[0]}-${range[1]} из ${total}` }}
        />
      </Spin>
      <Modal
        title={editingUser ? `Редактировать: ${editingUser.username}` : 'Создать пользователя'}
        open={isModalVisible} onCancel={handleModalCancel} confirmLoading={loading}
        onOk={() => form.submit()} okText={editingUser ? 'Сохранить' : 'Создать'} destroyOnHidden
      >
        <Form form={form} layout="vertical" name="user_form" onFinish={handleFormSubmit} >
          <Form.Item name="username" label="Имя пользователя (логин)" rules={[{ required: true, message: 'Введите имя пользователя!' }, {min: 3, message: 'Минимум 3 символа'}]}>
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="full_name" label="Полное имя" rules={[{ required: true, message: 'Введите полное имя!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label={editingUser ? 'Новый пароль' : 'Пароль'}
            rules={editingUser ? [{min: 6, message: 'Пароль должен быть не менее 6 символов'}] : [{ required: true, message: 'Введите пароль!' }, {min: 6, message: 'Пароль должен быть не менее 6 символов'}]}
            extra={editingUser ? "Оставьте пустым, если не хотите менять пароль." : ""} >
            <Input.Password placeholder={editingUser ? "Новый пароль (если нужно)" : "Пароль"}/>
          </Form.Item>
          <Form.Item name="role" label="Роль" rules={[{ required: true, message: 'Выберите роль!' }]} >
            <Select placeholder="Выберите роль">
              <Option value={UserRole.MANAGER}>Менеджер</Option>
              <Option value={UserRole.WAREHOUSE_KEEPER}>Кладовщик</Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_active" label="Статус" valuePropName="checked" >
            <Select placeholder="Выберите статус">
              <Option value={true}>Активен</Option>
              <Option value={false}>Неактивен</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;