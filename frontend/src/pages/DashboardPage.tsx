// frontend/src/pages/DashboardPage.tsx
import {
  DeleteOutlined, EditOutlined, MinusOutlined, PlusOutlined,
} from '@ant-design/icons'
import type { RadioChangeEvent } from 'antd'
import {
  Button, Card, Col, Divider, Empty, Form, Input,
  InputNumber, List, message, Modal, Progress, Radio,
  Row, Select, Space, Spin, Tooltip, Typography,
} from 'antd'
import type { ReactNode } from 'react'
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/apiClient'
import {
  addProductToCellApi,
  fetchCellContents,
  updateProductQuantityInCellApi,
} from '../api/storageCellService'
import GlobalSearchBar from '../components/common/SearchBar'
import { useAuth } from '../contexts/AuthContext'
import type {
  CellContentDetailedItem,
  CreateStorageCellDtoFE,
  ProductBasicInfo,
  StorageCell,
  UpdateStorageCellDtoFE,
} from '../types/entities'

const { Title, Text } = Typography;

// Определяем типы для результатов поиска, чтобы раскомментированный код работал
interface ProductSearchResult {
  id: string;
  type: 'product';
  name: string;
  sku: string;
  locations?: { code: string }[];
}
interface StorageCellSearchResult {
  id: string;
  type: 'storage-cell';
  code: string;
  description?: string;
  contents?: { name: string; quantity: number }[];
}
type SearchResultItem = ProductSearchResult | StorageCellSearchResult;

type CellActivityFilter = 'all' | 'active' | 'inactive';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Состояния для поиска (РАСКОММЕНТИРОВАНО)
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [storageCells, setStorageCells] = useState<StorageCell[]>([]);
  const [loadingCells, setLoadingCells] = useState(true);
  const [cellActivityFilter, setCellActivityFilter] = useState<CellActivityFilter>('active');

  const [selectedCell, setSelectedCell] = useState<StorageCell | null>(null);
  const [modalCellContents, setModalCellContents] = useState<CellContentDetailedItem[]>([]);
  const [loadingModalDetails, setLoadingModalDetails] = useState(false);
  const [isCellDetailModalVisible, setIsCellDetailModalVisible] = useState(false);

  const [availableProducts, setAvailableProducts] = useState<ProductBasicInfo[]>([]);
  const [productForOperation, setProductForOperation] = useState<string | undefined>(undefined);
  const [quantityForOperation, setQuantityForOperation] = useState<number>(1);

  const [isEditOrCreateCellModalVisible, setIsEditOrCreateCellModalVisible] = useState(false);
  const [editingCell, setEditingCell] = useState<StorageCell | null>(null);
  const [cellForm] = Form.useForm<CreateStorageCellDtoFE | UpdateStorageCellDtoFE>();
  const [loadingCellForm, setLoadingCellForm] = useState(false);

  const loadStorageCells = useCallback(async () => {
    setLoadingCells(true);
    try {
      let filterQueryParamString = '';
      if (cellActivityFilter === 'active') filterQueryParamString = '?is_active=true';
      else if (cellActivityFilter === 'inactive') filterQueryParamString = '?is_active=false';
      
      // ИСПРАВЛЕНО: Заменен вызов fetchStorageCells на прямой вызов apiClient для поддержки параметров
      const response = await apiClient.get<StorageCell[]>(`/storage-cells${filterQueryParamString}`);
      setStorageCells(response.data);
    } catch (error) { message.error('Не удалось загрузить ячейки склада'); console.error('Load cells error:', error); } 
    finally { setLoadingCells(false); }
  }, [cellActivityFilter]);

  useEffect(() => { loadStorageCells(); }, [loadStorageCells]);

  useEffect(() => {
    const fetchProductsForSelect = async () => {
        const currentModalLoader = isCellDetailModalVisible ? setLoadingModalDetails : setLoadingCellForm;
        currentModalLoader(true);
        try {
          // Загружаем только один раз
          if (availableProducts.length === 0) {
              const response = await apiClient.get<ProductBasicInfo[]>('/products?limit=1000&fields=id,name,sku,unit_of_measure');
              setAvailableProducts(response.data || []);
          }
        } catch (error) { message.error('Не удалось загрузить список товаров'); console.error('Fetch products error:', error); }
        finally { currentModalLoader(false); }
    };
    if (isCellDetailModalVisible || isEditOrCreateCellModalVisible) {
        fetchProductsForSelect();
    }
  }, [isCellDetailModalVisible, isEditOrCreateCellModalVisible, availableProducts.length]);

  // ИСПРАВЛЕНО: Функция поиска и связанные с ней элементы раскомментированы
  const handleGlobalSearch = async (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) { setSearchResults([]); return; }
    setLoadingSearch(true);
    try {
      // Предполагаем, что эндпоинт поиска возвращает объект с полем results
      const response = await apiClient.get<{ results: SearchResultItem[] }>(`/search/all?term=${encodeURIComponent(value)}`);
      setSearchResults(response.data.results || []);
    } catch (error) { message.error('Ошибка при выполнении поиска'); setSearchResults([]); console.error('Global search error:', error); }
    finally { setLoadingSearch(false); }
  };
  
  const renderSearchResultItem = (item: SearchResultItem): ReactNode => {
    if ('sku' in item) { // Type guard для ProductSearchResult
      return ( <List.Item key={`product-${item.id}`}> <List.Item.Meta title={<Link to={`/products/${item.id}`}>{item.name} (Товар)</Link>} description={`Артикул: ${item.sku}. ${item.locations && item.locations.length > 0 ? 'Находится в: ' + item.locations.map(l => l.code).join(', ') : ''}`} /> </List.Item> ); 
    }
    if ('code' in item) { // Type guard для StorageCellSearchResult
      return ( <List.Item key={`cell-${item.id}`}> <List.Item.Meta title={<Link to={`/storage`}>{item.code} (Ячейка)</Link>} description={`${item.description || ''}. ${item.contents && item.contents.length > 0 ? 'Содержит: ' + item.contents.map(c => `${c.name} (${c.quantity} шт.)`).join(', ') : ''}`} /> </List.Item> ); 
    }
    return null;
  };

  const openCellDetailModal = async (cell: StorageCell) => {
    setSelectedCell(cell);
    setIsCellDetailModalVisible(true);
    setLoadingModalDetails(true);
    try {
      const contents = await fetchCellContents(cell.id);
      setModalCellContents(contents);
    } catch (error) { message.error('Не удалось загрузить содержимое ячейки'); setModalCellContents([]); console.error('Open cell detail error:', error); }
    finally { setLoadingModalDetails(false); }
  };

  const handleCellDetailModalClose = () => {
    setIsCellDetailModalVisible(false); setModalCellContents([]);
    setProductForOperation(undefined); setQuantityForOperation(1);
  };

  const handleAddOrUpdateCellContent = async (isAddingAction: boolean) => {
    if (!selectedCell || !productForOperation || quantityForOperation < 0) { message.error('Выберите товар и укажите корректное количество.'); return; }
    setLoadingModalDetails(true);
    let itemInCellToOperate = modalCellContents.find(item => item.product.id === productForOperation);
    try {
      if (isAddingAction) {
        if (itemInCellToOperate) {
          if (quantityForOperation <= 0) { message.error('Количество для увеличения должно быть больше 0.'); setLoadingModalDetails(false); return;}
          const newQuantityInCell = itemInCellToOperate.quantity + quantityForOperation;
          await updateProductQuantityInCellApi(itemInCellToOperate.id, { quantity: newQuantityInCell });
          message.success(`Количество товара "${itemInCellToOperate.product.name}" увеличено.`);
        } else {
          if (quantityForOperation <= 0) { message.error('Количество для добавления должно быть больше 0.'); setLoadingModalDetails(false); return; }
          await addProductToCellApi(selectedCell.id, { productId: productForOperation, quantity: quantityForOperation });
          message.success(`Товар успешно добавлен в ячейку ${selectedCell.code}`);
        }
      } else {
        if (!itemInCellToOperate) { message.error('Выбранный товар для списания отсутствует.'); setLoadingModalDetails(false); return; }
        if (quantityForOperation > itemInCellToOperate.quantity) { message.error(`Нельзя списать ${quantityForOperation} шт. В ячейке ${itemInCellToOperate.quantity} шт.`); setLoadingModalDetails(false); return; }
        const newQuantityInCell = itemInCellToOperate.quantity - quantityForOperation;
        await updateProductQuantityInCellApi(itemInCellToOperate.id, { quantity: newQuantityInCell });
        message.success(newQuantityInCell === 0 ? `Товар "${itemInCellToOperate.product.name}" полностью удален.` : `Количество "${itemInCellToOperate.product.name}" уменьшено.`);
      }

      const updatedContents = await fetchCellContents(selectedCell.id);
      setModalCellContents(updatedContents);
      const updatedSelectedCellResponse = await apiClient.get<StorageCell>(`/storage-cells/${selectedCell.id}`);
      setSelectedCell(updatedSelectedCellResponse.data);
      setStorageCells(prevCells => prevCells.map(sc => sc.id === selectedCell.id ? updatedSelectedCellResponse.data : sc));
      setProductForOperation(undefined); setQuantityForOperation(1);

    } catch (error: any) { message.error(error.response?.data?.message || 'Операция с товаром не удалась.'); console.error('Cell content operation error:', error);
    } finally { setLoadingModalDetails(false); }
  };
  
  // ИСПРАВЛЕНО: Реализованы функции управления модальным окном ячейки
  const openCreateCellModal = () => {
    setEditingCell(null);
    cellForm.resetFields();
    cellForm.setFieldsValue({ is_active: true, max_items_capacity: 100 });
    setIsEditOrCreateCellModalVisible(true);
  };

  const openEditCellModal = (cell: StorageCell) => {
    setEditingCell(cell);
    cellForm.setFieldsValue({
      code: cell.code,
      description: cell.description,
      max_items_capacity: cell.max_items_capacity,
      is_active: cell.is_active,
    });
    setIsEditOrCreateCellModalVisible(true);
  };

  const handleEditOrCreateCellModalClose = () => {
    setIsEditOrCreateCellModalVisible(false);
    setEditingCell(null);
    cellForm.resetFields();
  };

  const handleCellFormSubmit = async (values: CreateStorageCellDtoFE | UpdateStorageCellDtoFE) => {
    setLoadingCellForm(true);
    try {
      if (editingCell) {
        await apiClient.patch(`/storage-cells/${editingCell.id}`, values);
        message.success(`Ячейка ${editingCell.code} успешно обновлена.`);
      } else {
        const createValues = values as CreateStorageCellDtoFE;
        await apiClient.post('/storage-cells', createValues);
        message.success(`Ячейка ${createValues.code} успешно создана.`);
      }
      handleEditOrCreateCellModalClose();
      await loadStorageCells();
    } catch (error: any) {
      message.error(error.response?.data?.message || `Не удалось ${editingCell ? 'обновить' : 'создать'} ячейку.`);
      console.error('Cell form submit error:', error);
    } finally {
      setLoadingCellForm(false);
    }
  };

  const handleDeleteCell = (cellId: string, cellCode: string) => {
    Modal.confirm({
      title: `Удалить ячейку ${cellCode}?`,
      content: 'Это действие необратимо. Убедитесь, что ячейка пуста.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await apiClient.delete(`/storage-cells/${cellId}`);
          message.success(`Ячейка ${cellCode} успешно удалена.`);
          await loadStorageCells();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Ошибка при удалении ячейки.');
          console.error('Delete cell error:', error);
        }
      },
    });
  };

  const OccupancyProgress: React.FC<{ occupancy: number; capacity: number }> = React.memo(({ occupancy, capacity }) => {
    const percentage = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;
    let statusType: 'success' | 'exception' | 'active' | 'normal' = 'success';
    let color: string | undefined = undefined;
    if (percentage > 85) { statusType = 'exception';
    } else if (percentage > 60) { statusType = 'active'; color = '#faad14'; }
    return <Progress percent={percentage} size="small" status={statusType} strokeColor={color} />;
  });
  OccupancyProgress.displayName = 'OccupancyProgress';

  if (loadingCells && storageCells.length === 0) { 
    return ( <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 128px)' }}> <Spin size="large" tip="Загрузка данных склада..."> <div style={{padding: 50}} /> </Spin></div> ); 
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2} style={{ marginBottom: '20px' }}>Главная панель</Title>
      <Row gutter={[16,24]} style={{marginBottom: 24}}>
        <Col span={24}> <GlobalSearchBar onSearch={handleGlobalSearch} loading={loadingSearch} /> </Col>
        {/* ИСПРАВЛЕНО: JSX для поиска раскомментирован */}
        {loadingSearch && <Col span={24} style={{ textAlign: 'center' }}><Spin tip="Поиск..."><div style={{padding:20, minHeight:50}}/></Spin></Col>}
        {!loadingSearch && searchTerm && searchResults.length === 0 && ( <Col span={24}><Empty description={`По запросу "${searchTerm}" ничего не найдено.`} /></Col> )}
        {searchResults.length > 0 && (
          <Col span={24}> <Card title={`Результаты поиска: "${searchTerm}"`}> <List itemLayout="horizontal" dataSource={searchResults} renderItem={renderSearchResultItem} /> </Card> </Col>
        )}
      </Row>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title level={3} style={{ margin: 0 }}>Складские ячейки</Title>
          <Space>
            {user?.role === 'MANAGER' && (
              <Radio.Group 
                value={cellActivityFilter} 
                onChange={(e: RadioChangeEvent) => setCellActivityFilter(e.target.value as CellActivityFilter)}
                optionType="button" buttonStyle="solid"
              >
                <Radio.Button value="active">Активные</Radio.Button>
                <Radio.Button value="inactive">Неактивные</Radio.Button>
                <Radio.Button value="all">Все</Radio.Button>
              </Radio.Group>
            )}
            {user?.role === 'MANAGER' && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCellModal}>
                    Добавить ячейку
                </Button>
            )}
          </Space>
      </div>
      
      {loadingCells && storageCells.length > 0 && <div style={{textAlign: 'center', marginBottom: 16}}><Spin tip="Обновление ячеек..."/></div> }
      {storageCells.length === 0 && !loadingCells ? ( <Empty description="Складские ячейки не найдены. Вы можете добавить новую." /> ) : (
        <Row gutter={[16, 16]}>
          {storageCells.map((cell) => (
            <Col key={cell.id} xs={24} sm={12} md={8} lg={6} xl={4}>
              <Card hoverable title={cell.code} onClick={() => openCellDetailModal(cell)} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.09)', height: '100%' }} styles={{ body: { paddingBottom: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 'calc(100% - 57px)' } }}
                actions={ user?.role === 'MANAGER' ? [
                    <Tooltip title="Редактировать ячейку" key="edit"><Button type="text" shape="circle" icon={<EditOutlined />} onClick={(e) => {e.stopPropagation(); openEditCellModal(cell);}} /></Tooltip>,
                    <Tooltip title="Удалить ячейку" key="delete"><Button type="text" shape="circle" danger icon={<DeleteOutlined />} onClick={(e) => {e.stopPropagation(); handleDeleteCell(cell.id, cell.code);}} /></Tooltip>
                ] : undefined } >
                <div>
                    {!cell.is_active && (<Text type="danger" strong style={{ display: 'block', textAlign: 'center', marginBottom: 5 }}>(Неактивна)</Text>)}
                    <Text type="secondary" style={{ marginBottom: '10px', minHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', }}>
                        {cell.description || 'Нет описания'}
                    </Text>
                    <div style={{ marginBottom: '8px' }}> <Text strong>Заполнено: </Text> <Text>{cell.current_occupancy} / {cell.max_items_capacity}</Text> </div>
                </div>
                <OccupancyProgress occupancy={cell.current_occupancy} capacity={cell.max_items_capacity} />
              </Card>
            </Col>
          ))}
        </Row>
      )}
      <Modal title={selectedCell ? `Операции с ячейкой: ${selectedCell.code}` : 'Детали ячейки'} open={isCellDetailModalVisible} onCancel={handleCellDetailModalClose} footer={null} width={800} destroyOnClose >
        {selectedCell && ( 
          <Spin spinning={loadingModalDetails} tip="Загрузка/обработка...">
            <div> 
               <Row gutter={16} style={{ marginBottom: 16 }}> <Col span={12}><Text strong>Описание: </Text><Text>{selectedCell.description || 'Нет'}</Text></Col> <Col span={12}><Text strong>Макс. вместимость: </Text><Text>{selectedCell.max_items_capacity}</Text></Col> </Row>
               <Row gutter={16} style={{ marginBottom: 16 }}> <Col span={12}><Text strong>Текущая заполненность: </Text><Text>{selectedCell.current_occupancy} ({ selectedCell.max_items_capacity > 0 ? Math.round((selectedCell.current_occupancy / selectedCell.max_items_capacity) * 100) : 0 }%)</Text></Col> <Col span={12}><OccupancyProgress occupancy={selectedCell.current_occupancy} capacity={selectedCell.max_items_capacity} /></Col> </Row>
              <Divider>Содержимое ячейки</Divider>
              {modalCellContents.length > 0 ? (
                <List size="small" dataSource={modalCellContents} renderItem={(item: CellContentDetailedItem) => ( <List.Item key={item.id} > <List.Item.Meta title={<Link to={`/products/${item.product.id}`}>{item.product.name}</Link>} description={`Арт: ${item.product.sku}, В ячейке: ${item.quantity} ${item.product.unit_of_measure || ''}`} /> </List.Item> )} />
              ) : ( <Empty description="Ячейка пуста" /> )}
              <Divider>Операции с товаром</Divider>
              <Text>Выберите товар и укажите количество для операции:</Text>
              <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size="middle">
                <Select showSearch placeholder="Сначала выберите товар..." value={productForOperation}
                  onChange={(value) => { setProductForOperation(value); const itemInCell = modalCellContents.find(it => it.product.id === value); setQuantityForOperation(itemInCell ? itemInCell.quantity : 1); }}
                  style={{ width: '100%' }} loading={loadingModalDetails && availableProducts.length === 0}
                  filterOption={(input, option) => (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={[ ...(modalCellContents.length > 0 ? [{ label: <Text strong>Товары в ячейке (для списания/изменения)</Text>, options: modalCellContents.map(item => ({ value: item.product.id, label: `${item.product.name} (Арт: ${item.product.sku}, В ячейке: ${item.quantity})`})) }] : []), ...(availableProducts.filter(p => !modalCellContents.some(mc => mc.product.id === p.id)).length > 0 ? [{ label: <Text strong>Доступные товары (для добавления)</Text>, options: availableProducts.filter(p => !modalCellContents.some(mc => mc.product.id === p.id)).map(p => ({ value: p.id, label: `${p.name} (Арт: ${p.sku})`}))}] : []) ]}
                  disabled={loadingModalDetails}
                  notFoundContent={loadingModalDetails ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Товары не найдены" />}
                />
                <InputNumber min={0} value={quantityForOperation} onChange={(value) => { if (value !== null && value >=0) setQuantityForOperation(value);}} style={{ width: '100%' }} placeholder="Количество" disabled={loadingModalDetails || !productForOperation} />
                <Row gutter={8}>
                    <Col span={12}> <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddOrUpdateCellContent(true)} block loading={loadingModalDetails} disabled={!productForOperation || quantityForOperation <= 0 } > Добавить/Увеличить </Button> </Col>
                    <Col span={12}> <Button type="primary" danger icon={<MinusOutlined />} onClick={() => handleAddOrUpdateCellContent(false)} block loading={loadingModalDetails} disabled={!productForOperation || quantityForOperation <= 0 || !modalCellContents.some(it => it.product.id === productForOperation) } > Убрать/Уменьшить </Button> </Col>
                </Row>
              </Space>
            </div>
          </Spin>
        )}
      </Modal>
      <Modal title={editingCell ? `Редактировать ячейку: ${editingCell?.code || ''}` : "Создать новую ячейку"} open={isEditOrCreateCellModalVisible} onCancel={handleEditOrCreateCellModalClose} confirmLoading={loadingCellForm} onOk={() => { cellForm.submit(); }} okText={editingCell ? "Сохранить" : "Создать"} destroyOnClose >
        <Spin spinning={loadingCellForm}>
          <Form form={cellForm} layout="vertical" name="cell_form_manage" onFinish={handleCellFormSubmit} >
              <Form.Item name="code" label="Код ячейки" rules={[{ required: true, message: 'Введите код!' }, {pattern: /^[a-zA-Z0-9-]+$/, message: 'Код: буквы, цифры, дефис'}]}>
                <Input disabled={!!editingCell}/>
              </Form.Item>
              <Form.Item name="description" label="Описание">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item name="max_items_capacity" label="Макс. вместимость" rules={[{ required: true, message: 'Укажите вместимость!' }, { type: 'number', min: 1, message: 'Больше 0'}]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="is_active" label="Статус ячейки" valuePropName="checked" > 
                <Select placeholder="Выберите статус"><Select.Option value={true}>Активна</Select.Option><Select.Option value={false}>Неактивна</Select.Option></Select>
              </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default DashboardPage;