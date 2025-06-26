// frontend/src/pages/ProductsPage.tsx
import {
	DeleteOutlined,
	EditOutlined,
	PlusOutlined,
	SearchOutlined,
} from '@ant-design/icons'
import {
	Button, Col, Form, Input, InputNumber, message, Modal, Popconfirm,
	Row, Select, Space, Spin, Table,
	Tooltip, Typography
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { useCallback, useEffect, useState } from 'react'
import {
	createProductApi,
	deleteProductApi,
	fetchProducts,
	updateProductApi,
} from '../api/productService'
import { useAuth } from '../contexts/AuthContext'
import type {
	CreateProductDtoFE,
	Product,
	UpdateProductDtoFE,
} from '../types/entities'

const { Title } = Typography;
const { Option } = Select;

const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm<CreateProductDtoFE | UpdateProductDtoFE>();
  const [searchText, setSearchText] = useState('');

  // Состояния для справочников (категории, поставщики) для формы
  // const [categories, setCategories] = useState<ProductCategory[]>([]);
  // const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedProducts = await fetchProducts();
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
    } catch (error) {
      message.error('Не удалось загрузить список товаров.');
      console.error("Load products error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!searchText) {
      setFilteredProducts(products);
      return;
    }
    const lowercasedFilter = searchText.toLowerCase();
    const filteredData = products.filter((item) =>
      item.name.toLowerCase().includes(lowercasedFilter) ||
      item.sku.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredProducts(filteredData);
  }, [searchText, products]);

  const showCreateModal = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({ unit_of_measure: 'шт' });
    setIsModalVisible(true);
  };

  const showEditModal = (productToEdit: Product) => {
    setEditingProduct(productToEdit);
    // ИСПРАВЛЕНО: Явное сопоставление полей для избежания несовместимости типов.
    // 'null' значения преобразуются в 'undefined', чтобы форма их правильно обработала.
    form.setFieldsValue({
      name: productToEdit.name,
      sku: productToEdit.sku,
      description: productToEdit.description ?? undefined,
      unit_of_measure: productToEdit.unit_of_measure,
      purchase_price: productToEdit.purchase_price ?? undefined,
      category_id: productToEdit.category?.id,
      supplier_id: productToEdit.supplier?.id,
    });
    setIsModalVisible(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    setLoading(true);
    try {
      await deleteProductApi(productId);
      message.success('Товар успешно удален.');
      await loadProducts();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Не удалось удалить товар.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
    form.resetFields();
  };

  const handleFormSubmit = async (values: CreateProductDtoFE | UpdateProductDtoFE) => {
    setLoading(true);
    // Преобразуем пустые строки в undefined для опциональных полей
    const payload = { ...values };
    if (payload.description === '') payload.description = undefined;
    if (payload.category_id === '') payload.category_id = undefined;
    if (payload.supplier_id === '') payload.supplier_id = undefined;

    try {
      if (editingProduct && editingProduct.id) {
        await updateProductApi(editingProduct.id, payload as UpdateProductDtoFE);
        message.success('Товар успешно обновлен.');
      } else {
        await createProductApi(payload as CreateProductDtoFE);
        message.success('Товар успешно создан.');
      }
      setIsModalVisible(false);
      setEditingProduct(null);
      form.resetFields();
      await loadProducts();
    } catch (error: any) {
      message.error(error.response?.data?.message || `Не удалось ${editingProduct ? 'обновить' : 'создать'} товар.`);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Product> = [
    { title: 'Артикул (SKU)', dataIndex: 'sku', key: 'sku', sorter: (a, b) => a.sku.localeCompare(b.sku) },
    { title: 'Наименование', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Категория', dataIndex: ['category', 'name'], key: 'category' },
    { title: 'Ед. изм.', dataIndex: 'unit_of_measure', key: 'unit_of_measure' },
    { title: 'Цена закупки', dataIndex: 'purchase_price', key: 'purchase_price', render: (price) => price != null ? `${price} ₽` : '–' },
    {
      title: 'Действия',
      key: 'actions',
      align: 'center',
      render: (_: any, record: Product) => (
        <Space size="small">
          <Tooltip title="Редактировать"><Button shape="circle" icon={<EditOutlined />} onClick={() => showEditModal(record)} /></Tooltip>
          {user?.role === 'MANAGER' && (
            <Popconfirm title={`Удалить "${record.name}"?`} onConfirm={() => handleDeleteProduct(record.id)} okText="Удалить" okType="danger" cancelText="Отмена">
              <Tooltip title="Удалить"><Button shape="circle" danger icon={<DeleteOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Title level={2} style={{ margin: 0 }}>Управление товарами</Title>
        <Space>
          <Input
            placeholder="Поиск по наименованию или артикулу"
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal} disabled={loading}>
            Добавить товар
          </Button>
        </Space>
      </div>
      <Spin spinning={loading} tip="Загрузка товаров...">
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          bordered
          size="middle"
          scroll={{ x: 'max-content' }}
        />
      </Spin>
      <Modal
        title={editingProduct ? `Редактировать товар: ${editingProduct.name}` : 'Создать новый товар'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        onOk={() => form.submit()}
        okText={editingProduct ? 'Сохранить' : 'Создать'}
        destroyOnClose // Changed from destroyOnHidden for better state management
        width={800}
      >
        <Form form={form} layout="vertical" name="product_form" onFinish={handleFormSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Наименование" rules={[{ required: true, message: 'Введите наименование!' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sku" label="Артикул (SKU)" rules={[{ required: true, message: 'Введите артикул!' }]}>
                <Input disabled={!!editingProduct}/>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="unit_of_measure" label="Единица измерения" rules={[{ required: true, message: 'Укажите ед. изм.!' }]}>
                <Input placeholder="шт, кг, м, л..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purchase_price" label="Цена закупки, ₽">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category_id" label="Категория">
                <Select placeholder="Выберите категорию (опционально)" allowClear>
                  {/* Здесь должна быть динамическая загрузка */}
                  <Option value="id-категории-1">Ноутбуки (Пример)</Option>
                  <Option value="id-категории-2">Компоненты (Пример)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supplier_id" label="Поставщик">
                <Select placeholder="Выберите поставщика (опционально)" allowClear>
                   {/* Здесь должна быть динамическая загрузка */}
                   <Option value="id-поставщика-1">ООО Техномир (Пример)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductsPage;