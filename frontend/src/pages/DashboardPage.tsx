// frontend/src/pages/DashboardPage.tsx
import {
  DeleteOutlined,
  EditOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form, Input,
  InputNumber,
  List,
  message,
  Modal,
  Progress,
  Row,
  Select, Space,
  Spin,
  Tooltip,
  Typography,
} from 'antd'
import type { ReactNode } from 'react'
import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/apiClient'
import {
  addProductToCellApi,
  fetchCellContents,
  fetchStorageCells,
  updateProductQuantityInCellApi,
} from '../api/storageCellService'
import GlobalSearchBar from '../components/common/SearchBar'
import { useAuth } from '../contexts/AuthContext'
import type {
  CellContentDetailedItem,
  CreateStorageCellDtoFE,
  ProductBasicInfo,
  StorageCell, // Убедись, что этот тип определен в types/entities.ts
  UpdateStorageCellDtoFE // И этот тоже
} from '../types/entities'

const { Title, Text } = Typography;

interface ProductSearchResult { id: string; name: string; sku: string; type: 'product'; locations?: { code: string; cellId: string }[]; }
interface StorageCellSearchResult { id: string; code: string; description?: string | null; type: 'storage-cell'; contents?: { name: string; productId: string; quantity: number }[]; }
type SearchResultItem = ProductSearchResult | StorageCellSearchResult;

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [storageCells, setStorageCells] = useState<StorageCell[]>([]);
  const [loadingCells, setLoadingCells] = useState(true);

  const [selectedCell, setSelectedCell] = useState<StorageCell | null>(null);
  const [modalCellContents, setModalCellContents] = useState<CellContentDetailedItem[]>([]);
  const [loadingModalDetails, setLoadingModalDetails] = useState(false);
  const [isCellDetailModalVisible, setIsCellDetailModalVisible] = useState(false);

  const [availableProducts, setAvailableProducts] = useState<ProductBasicInfo[]>([]);
  const [productForOperation, setProductForOperation] = useState<string | undefined>(undefined);
  const [quantityForOperation, setQuantityForOperation] = useState<number>(1);

  // Состояния и форма для создания/редактирования ячейки
  const [isEditOrCreateCellModalVisible, setIsEditOrCreateCellModalVisible] = useState(false);
  const [editingCell, setEditingCell] = useState<StorageCell | null>(null); // null для создания, объект для редактирования
  const [cellForm] = Form.useForm<CreateStorageCellDtoFE | UpdateStorageCellDtoFE>(); // Типизируем форму
  const [loadingCellForm, setLoadingCellForm] = useState(false);

  const loadStorageCells = useCallback(async () => {
    setLoadingCells(true);
    try { const cells = await fetchStorageCells(); setStorageCells(cells); }
    catch (error) { message.error('Не удалось загрузить ячейки склада'); console.error('Load cells error:', error); } 
    finally { setLoadingCells(false); }
  }, []);

  useEffect(() => { loadStorageCells(); }, [loadStorageCells]);

  useEffect(() => {
    const fetchProductsForSelect = async () => {
      if ((isCellDetailModalVisible || isEditOrCreateCellModalVisible) && availableProducts.length === 0) {
        const currentModalLoader = isCellDetailModalVisible ? setLoadingModalDetails : setLoadingCellForm;
        currentModalLoader(true);
        try {
          const response = await apiClient.get<ProductBasicInfo[]>('/products?limit=1000&fields=id,name,sku,unit_of_measure');
          setAvailableProducts(response.data || []);
        } catch (error) { message.error('Не удалось загрузить список товаров'); console.error('Fetch products error:', error); }
        finally { currentModalLoader(false); }
      }
    };
    if (isCellDetailModalVisible || isEditOrCreateCellModalVisible) {
        fetchProductsForSelect();
    }
  }, [isCellDetailModalVisible, isEditOrCreateCellModalVisible, availableProducts.length]);

  const handleGlobalSearch = async (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) { setSearchResults([]); return; }
    setLoadingSearch(true);
    try {
      const response = await apiClient.get<{ results: SearchResultItem[] }>(`/search?term=${encodeURIComponent(value)}`);
      setSearchResults(response.data.results || []);
    } catch (error) { message.error('Ошибка при выполнении поиска'); setSearchResults([]); console.error('Global search error:', error); }
    finally { setLoadingSearch(false); }
  };
  
  const renderSearchResultItem = (item: SearchResultItem, index: number): ReactNode => {
    const key = `${item.id}-${item.type}-${index}`;
    if (item.type === 'product') { return ( <List.Item key={key}> <List.Item.Meta title={<Link to={`/products/${item.id}`}>{item.name} (Товар)</Link>} description={`Артикул: ${item.sku}. ${item.locations && item.locations.length > 0 ? 'Находится в: ' + item.locations.map(l => l.code).join(', ') : ''}`} /> </List.Item> ); }
    if (item.type === 'storage-cell') { return ( <List.Item key={key}> <List.Item.Meta title={<Link to={`/storage-cells/${item.id}`}>{item.code} (Ячейка)</Link>} description={`${item.description || ''}. ${item.contents && item.contents.length > 0 ? 'Содержит: ' + item.contents.map(c => `${c.name} (${c.quantity} шт.)`).join(', ') : ''}`} /> </List.Item> ); }
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
    if (!selectedCell || !productForOperation || quantityForOperation < 0) {
      message.error('Выберите товар и укажите корректное количество.'); return;
    }
    setLoadingModalDetails(true);
    let itemInCellToOperate = modalCellContents.find(item => item.product.id === productForOperation);
    try {
      let newQuantityInCell: number; let operationPerformed = false;
      if (isAddingAction) {
        if (itemInCellToOperate) {
          newQuantityInCell = itemInCellToOperate.quantity + quantityForOperation;
          if (quantityForOperation <= 0) { message.error('Количество для увеличения должно быть больше 0.'); setLoadingModalDetails(false); return;}
          await updateProductQuantityInCellApi(itemInCellToOperate.id, { quantity: newQuantityInCell });
          message.success(`Количество товара "${itemInCellToOperate.product.name}" увеличено.`);
          operationPerformed = true;
        } else {
          if (quantityForOperation <= 0) { message.error('Количество для добавления должно быть больше 0.'); setLoadingModalDetails(false); return; }
          await addProductToCellApi(selectedCell.id, { productId: productForOperation, quantity: quantityForOperation });
          message.success(`Товар успешно добавлен в ячейку ${selectedCell.code}`);
          operationPerformed = true;
        }
      } else {
        if (!itemInCellToOperate) { message.error('Выбранный товар для списания отсутствует.'); setLoadingModalDetails(false); return; }
        if (quantityForOperation > itemInCellToOperate.quantity) { message.error(`Нельзя списать ${quantityForOperation} шт. В ячейке ${itemInCellToOperate.quantity} шт.`); setLoadingModalDetails(false); return; }
        newQuantityInCell = itemInCellToOperate.quantity - quantityForOperation;
        await updateProductQuantityInCellApi(itemInCellToOperate.id, { quantity: newQuantityInCell });
        if (newQuantityInCell === 0) message.success(`Товар "${itemInCellToOperate.product.name}" полностью удален.`);
        else message.success(`Количество "${itemInCellToOperate.product.name}" уменьшено.`);
        operationPerformed = true;
      }
      if (operationPerformed) {
        const updatedContents = await fetchCellContents(selectedCell.id);
        setModalCellContents(updatedContents);
        const updatedSelectedCellResponse = await apiClient.get<StorageCell>(`/storage-cells/${selectedCell.id}`);
        if (updatedSelectedCellResponse.data) {
          setSelectedCell(updatedSelectedCellResponse.data);
          setStorageCells(prevCells => prevCells.map(sc => sc.id === selectedCell.id ? updatedSelectedCellResponse.data : sc));
        } else { loadStorageCells(); }
        setProductForOperation(undefined); setQuantityForOperation(1);
      }
    } catch (error: any) { message.error(error.response?.data?.message || 'Операция с товаром не удалась.'); console.error('Cell content operation error:', error);
    } finally { setLoadingModalDetails(false); }
  };
  
  // --- Функции для CRUD самих ЯЧЕЕК (Раскомментированы и используются) ---
  const openCreateCellModal = () => {
    setEditingCell(null); 
    cellForm.resetFields();
    cellForm.setFieldsValue({ is_active: true, max_items_capacity: 100 }); // Устанавливаем значения по умолчанию для НОВОЙ ячейки
    setIsEditOrCreateCellModalVisible(true);
  };

  const openEditCellModal = (cell: StorageCell) => {
    setEditingCell(cell); 
    cellForm.setFieldsValue({ // Заполняем форму текущими значениями
      code: cell.code,
      description: cell.description || '', 
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
      if (editingCell && editingCell.id) { 
        await apiClient.patch(`/storage-cells/${editingCell.id}`, values);
        message.success(`Ячейка ${values.code || editingCell.code} успешно обновлена.`);
      } else { 
        await apiClient.post('/storage-cells', values);
        message.success(`Ячейка ${(values as CreateStorageCellDtoFE).code} успешно создана.`);
      }
      loadStorageCells(); 
      handleEditOrCreateCellModalClose(); 
    } catch (error: any) { 
      message.error(error.response?.data?.message || `Не удалось ${editingCell ? 'обновить' : 'создать'} ячейку.`); 
      console.error("Cell form submit error:", error);
    } finally { 
      setLoadingCellForm(false); 
    }
  };

  const handleDeleteCell = (cellId: string, cellCode: string) => {
    Modal.confirm({
      title: `Удалить ячейку ${cellCode}?`,
      content: 'Удаление возможно только для пустых ячеек. Это действие невозможно отменить.',
      okText: 'Удалить', okType: 'danger', cancelText: 'Отмена',
      onOk: async () => {
        setLoadingCells(true); 
        try { await apiClient.delete(`/storage-cells/${cellId}`); message.success(`Ячейка ${cellCode} успешно удалена.`); loadStorageCells(); }
        catch (error: any) { message.error(error.response?.data?.message || 'Не удалось удалить ячейку.'); console.error('Delete cell error:', error); }
        finally { setLoadingCells(false); }
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

  if (loadingCells && storageCells.length === 0) { return ( <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 128px)' }}> <Spin size="large" tip="Загрузка данных склада..." /> </div> ); }

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2} style={{ marginBottom: '20px' }}>Главная панель</Title>
      <Row gutter={[16,24]} style={{marginBottom: 24}}>
        <Col span={24}> <GlobalSearchBar onSearch={handleGlobalSearch} loading={loadingSearch} /> </Col>
        {loadingSearch && <Col span={24} style={{ textAlign: 'center' }}><Spin><div style={{padding:20, minHeight:50}}/></Spin></Col>} {/* Обернул в div для tip */}
        {!loadingSearch && searchTerm && searchResults.length === 0 && ( <Col span={24}><Empty description={`По запросу "${searchTerm}" ничего не найдено.`} /></Col> )}
        {searchResults.length > 0 && (
          <Col span={24}> <Card title={`Результаты поиска: "${searchTerm}"`}> <List itemLayout="horizontal" dataSource={searchResults} renderItem={renderSearchResultItem} /> </Card> </Col>
        )}
      </Row>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title level={3} style={{ margin: 0 }}>Складские ячейки</Title>
          {user?.role === 'MANAGER' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCellModal}> {/* РАСКОММЕНТИРОВАНО И РАБОТАЕТ */}
                  Добавить ячейку
              </Button>
          )}
      </div>

      {loadingCells && storageCells.length > 0 && <div style={{textAlign: 'center', marginBottom: 16}}><Spin><div style={{padding:20, minHeight:50}} /></Spin></div> } {/* Обернул в div для tip */}
      {storageCells.length === 0 && !loadingCells ? (
        <Empty description="Складские ячейки не найдены. Вы можете добавить новую." />
      ) : (
        <Row gutter={[16, 16]}>
          {storageCells.map((cell) => (
            <Col key={cell.id} xs={24} sm={12} md={8} lg={6} xl={4}>
              <Card
                hoverable title={cell.code} onClick={() => openCellDetailModal(cell)}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.09)', height: '100%' }}
                styles={{ body: { paddingBottom: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 'calc(100% - 57px)' } }} // ИСПРАВЛЕНО bodyStyle
                actions={ user?.role === 'MANAGER' ? [ // РАСКОММЕНТИРОВАНО И РАБОТАЕТ
                    <Tooltip title="Редактировать ячейку" key="edit"><Button type="text" shape="circle" icon={<EditOutlined />} onClick={(e) => {e.stopPropagation(); openEditCellModal(cell);}} /></Tooltip>,
                    <Tooltip title="Удалить ячейку" key="delete"><Button type="text" shape="circle" danger icon={<DeleteOutlined />} onClick={(e) => {e.stopPropagation(); handleDeleteCell(cell.id, cell.code);}} /></Tooltip>
                ] : undefined }
              >
                <div>
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

      {/* Модальное окно для ДЕТАЛЕЙ ячейки и операций с товарами */}
      <Modal
        title={selectedCell ? `Операции с ячейкой: ${selectedCell.code}` : 'Детали ячейки'}
        open={isCellDetailModalVisible} 
        onCancel={handleCellDetailModalClose}
        footer={null} width={800} 
        destroyOnHidden // ИСПРАВЛЕНО destroyOnClose
      >
        {selectedCell && ( 
          <Spin spinning={loadingModalDetails} tip="Загрузка/обработка...">
             {/* Оборачиваем контент модалки в div для Spin, если он не имеет других дочерних элементов */}
            <div> 
               <Row gutter={16} style={{ marginBottom: 16 }}> <Col span={12}><Text strong>Описание: </Text><Text>{selectedCell.description || 'Нет'}</Text></Col> <Col span={12}><Text strong>Макс. вместимость: </Text><Text>{selectedCell.max_items_capacity}</Text></Col> </Row>
               <Row gutter={16} style={{ marginBottom: 16 }}> <Col span={12}><Text strong>Текущая заполненность: </Text><Text>{selectedCell.current_occupancy} ({ selectedCell.max_items_capacity > 0 ? Math.round((selectedCell.current_occupancy / selectedCell.max_items_capacity) * 100) : 0 }%)</Text></Col> <Col span={12}><OccupancyProgress occupancy={selectedCell.current_occupancy} capacity={selectedCell.max_items_capacity} /></Col> </Row>
              <Divider>Содержимое ячейки</Divider>
              {modalCellContents.length > 0 ? (
                <List size="small" dataSource={modalCellContents}
                  renderItem={(item: CellContentDetailedItem) => ( <List.Item key={item.id} > <List.Item.Meta title={<Link to={`/products/${item.product.id}`}>{item.product.name}</Link>} description={`Арт: ${item.product.sku}, В ячейке: ${item.quantity} ${item.product.unit_of_measure || ''}`} /> </List.Item> )}
                />
              ) : ( <Empty description="Ячейка пуста" /> )}
              
              <Divider>Операции с товаром</Divider>
              <Text>Выберите товар и укажите количество для операции:</Text>
              <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size="middle">
                <Select
                  showSearch placeholder="Сначала выберите товар..." value={productForOperation}
                  onChange={(value) => {
                      setProductForOperation(value);
                      const itemInCell = modalCellContents.find(it => it.product.id === value);
                      const newProdInfo = availableProducts.find(p => p.id === value && !modalCellContents.some(mc => mc.product.id === p.id));
                      setQuantityForOperation(itemInCell ? itemInCell.quantity : (newProdInfo ? 1 : 1) );
                  }}
                  style={{ width: '100%' }}
                  loading={loadingModalDetails && availableProducts.length === 0 && isCellDetailModalVisible}
                  filterOption={(input, option) => (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={[
                      ...(modalCellContents.length > 0 ? [{ label: <Text strong>Товары в ячейке (для списания/изменения)</Text>, options: modalCellContents.map(item => ({ value: item.product.id, label: `${item.product.name} (Арт: ${item.product.sku}, В ячейке: ${item.quantity})`})) }] : []),
                      ...(modalCellContents.length > 0 && availableProducts.filter(p => !modalCellContents.some(mc => mc.product.id === p.id)).length > 0 ? [{type: 'divider' as const}] : []),
                      ...(availableProducts.filter(p => !modalCellContents.some(mc => mc.product.id === p.id)).length > 0 ? [{ label: <Text strong>Доступные товары (для добавления)</Text>, options: availableProducts.filter(p => !modalCellContents.some(mc => mc.product.id === p.id)).map(p => ({ value: p.id, label: `${p.name} (Арт: ${p.sku})`}))}] : [])
                  ]}
                  disabled={loadingModalDetails}
                  notFoundContent={loadingModalDetails ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Товары не найдены" />}
                />
                <InputNumber min={0} value={quantityForOperation} onChange={(value) => { if (value !== null && value >=0) setQuantityForOperation(value);}} style={{ width: '100%' }} placeholder="Количество" disabled={loadingModalDetails || !productForOperation} />
                <Row gutter={8}>
                    <Col span={12}> <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddOrUpdateCellContent(true)} block loading={loadingModalDetails} disabled={!productForOperation || quantityForOperation <= 0 } > Добавить/Увеличить </Button> </Col>
                    <Col span={12}> <Button type="primary" danger icon={<MinusOutlined />} onClick={() => handleAddOrUpdateCellContent(false)} block loading={loadingModalDetails} disabled={!productForOperation || quantityForOperation < 0 || !modalCellContents.some(it => it.product.id === productForOperation) } > Убрать/Уменьшить </Button> </Col>
                </Row>
              </Space>
            </div>
          </Spin>
        )}
      </Modal>
        
      {/* Модальное окно для СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ячейки */}
      <Modal
        title={editingCell ? `Редактировать ячейку: ${editingCell?.code || ''}` : "Создать новую ячейку"}
        open={isEditOrCreateCellModalVisible}
        onCancel={handleEditOrCreateCellModalClose}
        confirmLoading={loadingCellForm}
        onOk={() => { cellForm.submit(); }}
        okText={editingCell ? "Сохранить" : "Создать"}
        destroyOnHidden // ИСПРАВЛЕНО destroyOnClose
      >
        <Spin spinning={loadingCellForm}>
          <Form
              form={cellForm}
              layout="vertical"
              name="cell_form"
              onFinish={handleCellFormSubmit}
          >
              <Form.Item name="code" label="Код ячейки" rules={[{ required: true, message: 'Введите код!' }, {pattern: /^[a-zA-Z0-9-]+$/, message: 'Код: буквы, цифры, дефис'}]}>
                <Input disabled={!!editingCell}/>
              </Form.Item>
              <Form.Item name="description" label="Описание">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item name="max_items_capacity" label="Макс. вместимость" rules={[{ required: true, message: 'Укажите вместимость!' }, { type: 'number', min: 1, message: 'Больше 0'}]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              {/* Убран initialValue с Form.Item, т.к. устанавливается через cellForm.setFieldsValue */}
              <Form.Item name="is_active" label="Активна" valuePropName="checked" > 
                <Select placeholder="Выберите статус" /* defaultValue={true} здесь не нужен */ ><Select.Option value={true}>Да</Select.Option><Select.Option value={false}>Нет</Select.Option></Select>
              </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default DashboardPage;