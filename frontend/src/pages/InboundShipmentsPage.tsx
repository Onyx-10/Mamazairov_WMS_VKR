// frontend/src/pages/InboundShipmentsPage.tsx
import { CheckCircleOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import {
    Button, DatePicker, Divider, Form, Input, InputNumber, List,
    message, Modal, Select,
    Spin, Table, Tag, Tooltip, Typography
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useCallback, useEffect, useState } from 'react'
import apiClient from '../api/apiClient'
import {
    addItemToInboundShipmentApi,
    createInboundShipmentApi,
    fetchInboundShipmentById,
    fetchInboundShipments,
    updateInboundShipmentItemApi,
    updateInboundShipmentStatusApi, // ИСПРАВЛЕНО: Добавлен правильный импорт
} from '../api/inboundShipmentService'
import {
    ShipmentStatus, type CreateInboundShipmentDtoFE, type InboundShipment, type InboundShipmentItem,
    type Product, type StorageCell, type Supplier
} from '../types/entities'

const { Title, Text } = Typography;
const { Option } = Select;

// ИСПРАВЛЕНО: Локальный тип для формы создания
interface CreateInboundShipmentFormValues {
    document_number: string;
    expected_date?: Dayjs;
    supplier_id?: string;
    notes?: string;
}

const StatusTag: React.FC<{ status: ShipmentStatus }> = ({ status }) => {
    const statusMap = {
        [ShipmentStatus.PLANNED]: { color: 'blue', text: 'Запланировано' },
        [ShipmentStatus.IN_PROGRESS]: { color: 'processing', text: 'В процессе' },
        [ShipmentStatus.COMPLETED]: { color: 'success', text: 'Завершено' },
        [ShipmentStatus.CANCELLED]: { color: 'error', text: 'Отменено' },
    };
    return <Tag color={statusMap[status]?.color || 'default'}>{statusMap[status]?.text || status}</Tag>;
};

const InboundShipmentsPage: React.FC = () => {
    // ИСПРАВЛЕНО: Удалена неиспользуемая переменная user
    const [shipments, setShipments] = useState<InboundShipment[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    // ИСПРАВЛЕНО: Форма типизирована FormValues
    const [createForm] = Form.useForm<CreateInboundShipmentFormValues>();

    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<InboundShipment | null>(null);
    const [editingItem, setEditingItem] = useState<InboundShipmentItem | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [storageCells, setStorageCells] = useState<StorageCell[]>([]);
    
    const [addItemForm] = Form.useForm();
    const [receiveItemForm] = Form.useForm();

    const loadShipments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchInboundShipments();
            setShipments(data);
        } catch (error) { message.error('Не удалось загрузить список приёмок.'); }
        finally { setLoading(false); }
    }, []);

    const loadDictionaries = useCallback(async () => {
        try {
            if (suppliers.length === 0) {
                const supRes = await apiClient.get<Supplier[]>('/suppliers');
                setSuppliers(supRes.data || []);
            }
            if (products.length === 0) {
                // Предполагаем, что бэкенд возвращает объект с полем items при лимитировании
                const prodRes = await apiClient.get<{items: Product[]}>('/products?limit=2000');
                setProducts(prodRes.data.items || []);
            }
            if (storageCells.length === 0) {
                const cellRes = await apiClient.get<StorageCell[]>('/storage-cells?is_active=true');
                setStorageCells(cellRes.data || []);
            }
        } catch { message.error("Ошибка при загрузке справочников"); }
    }, [suppliers.length, products.length, storageCells.length]);

    useEffect(() => { loadShipments(); }, [loadShipments]);

    const refreshDetails = async (shipmentId: string) => {
        if (!shipmentId) return;
        setLoadingDetails(true);
        try {
            const details = await fetchInboundShipmentById(shipmentId);
            setSelectedShipment(details);
            setShipments(prev => prev.map(s => s.id === shipmentId ? details : s));
        } catch (e) {
            message.error("Не удалось обновить детали приёмки");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleShowCreateModal = () => {
        loadDictionaries();
        createForm.resetFields();
        // ИСПРАВЛЕНО: Типобезопасная установка значения Dayjs
        createForm.setFieldsValue({ document_number: `IN-${dayjs().format('YYYYMMDD-HHmm')}`, expected_date: dayjs() });
        setIsCreateModalVisible(true);
    };

    const handleCreateShipment = async (values: CreateInboundShipmentFormValues) => {
        setLoading(true);
        try {
            // ИСПРАВЛЕНО: Преобразование Dayjs в строку перед отправкой
            const payload: CreateInboundShipmentDtoFE = {
                ...values,
                expected_date: values.expected_date?.toISOString(),
            };
            await createInboundShipmentApi(payload);
            message.success('Приёмка успешно создана.');
            setIsCreateModalVisible(false);
            loadShipments();
        } catch (error: any) { message.error(error.response?.data?.message || 'Ошибка создания.'); }
        finally { setLoading(false); }
    };

    const handleShowDetails = async (shipmentId: string) => {
        setIsDetailModalVisible(true);
        await loadDictionaries();
        await refreshDetails(shipmentId);
    };

    const handleAddItem = async (values: any) => {
        if (!selectedShipment) return;
        setLoadingDetails(true);
        try {
            await addItemToInboundShipmentApi(selectedShipment.id, values);
            // ИСПРАВЛЕНО: Перезагружаем детали вместо использования некорректного return value
            await refreshDetails(selectedShipment.id);
            addItemForm.resetFields();
            message.success('Товар добавлен в план приёмки.');
        } catch (error: any) { message.error(error.response?.data?.message || 'Ошибка добавления товара.'); }
        finally { setLoadingDetails(false); }
    };
    
    const handleReceiveItem = async (values: any) => {
        if (!selectedShipment || !editingItem) return;
        setLoadingDetails(true);
        try {
            await updateInboundShipmentItemApi(selectedShipment.id, editingItem.id, {
                quantity_received: values.quantity_received,
                target_storage_cell_id: values.target_storage_cell_id,
            });
            // ИСПРАВЛЕНО: Перезагружаем детали
            await refreshDetails(selectedShipment.id);
            setEditingItem(null);
            message.success(`Товар ${editingItem.product.name} оприходован.`);
        } catch(error: any) { message.error(error.response?.data?.message || 'Ошибка оприходования.'); }
        finally { setLoadingDetails(false); }
    };
    
    // ИСПРАВЛЕНО: Используется правильная функция для смены статуса
    const handleProcessShipment = async () => {
        if (!selectedShipment) return;
        setLoadingDetails(true);
        try {
            const updatedShipment = await updateInboundShipmentStatusApi(selectedShipment.id, ShipmentStatus.COMPLETED);
            setSelectedShipment(updatedShipment);
            setShipments(prev => prev.map(s => s.id === updatedShipment.id ? updatedShipment : s));
            message.success("Приёмка успешно завершена!");
            setIsDetailModalVisible(false);
        } catch(error: any) { message.error(error.response?.data?.message || 'Ошибка завершения приёмки.'); }
        finally { setLoadingDetails(false); }
    };

    const columns: ColumnsType<InboundShipment> = [
        { title: 'Номер', dataIndex: 'document_number', key: 'doc_number', width: 200, ellipsis: true },
        { title: 'Ожидаемая дата', dataIndex: 'expected_date', key: 'date', render: (date) => date ? dayjs(date).format('DD.MM.YYYY') : '–' },
        { title: 'Поставщик', dataIndex: ['supplier', 'name'], key: 'supplier', render: (name) => name || '–' },
        { title: 'Статус', dataIndex: 'status', key: 'status', render: (status: ShipmentStatus) => <StatusTag status={status} /> },
        { title: 'Автор', dataIndex: ['created_by', 'full_name'], key: 'creator' },
        { title: 'Действия', key: 'actions', align: 'center',
            render: (_, record) => (<Tooltip title="Детали приёмки"><Button shape="circle" icon={<EyeOutlined />} onClick={() => handleShowDetails(record.id)} /></Tooltip>),
        },
    ];

    const canBeModified = selectedShipment?.status === ShipmentStatus.PLANNED || selectedShipment?.status === ShipmentStatus.IN_PROGRESS;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Title level={2} style={{ margin: 0 }}>Приёмка товаров</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleShowCreateModal}>Запланировать приёмку</Button>
            </div>
            <Spin spinning={loading} tip="Загрузка...">
                <Table columns={columns} dataSource={shipments} rowKey="id" bordered size="middle" scroll={{ x: 'max-content' }}/>
            </Spin>

            <Modal title="Новая приёмка" open={isCreateModalVisible} onCancel={() => setIsCreateModalVisible(false)} onOk={() => createForm.submit()} confirmLoading={loading} destroyOnClose>
                <Form form={createForm} layout="vertical" onFinish={handleCreateShipment}>
                    <Form.Item name="document_number" label="Номер документа" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="expected_date" label="Ожидаемая дата">
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="supplier_id" label="Поставщик">
                        <Select placeholder="Не обязательно" allowClear showSearch optionFilterProp="children">{suppliers.map(sup => <Option key={sup.id} value={sup.id}>{sup.name}</Option>)}</Select>
                    </Form.Item>
                </Form>
            </Modal>
            
            <Modal title={selectedShipment ? `Приёмка №${selectedShipment.document_number}` : 'Детали'} open={isDetailModalVisible} width={1000} onCancel={() => setIsDetailModalVisible(false)} footer={
                canBeModified ? <Button type="primary" onClick={handleProcessShipment} icon={<CheckCircleOutlined />}>Завершить приёмку</Button> : null
            } destroyOnClose>
                <Spin spinning={loadingDetails} tip="Загрузка деталей...">
                    {selectedShipment && <>
                        <Divider>Товары к приёмке</Divider>
                        <List
                            itemLayout="horizontal"
                            dataSource={selectedShipment.items}
                            renderItem={(item: InboundShipmentItem) => (
                                <List.Item actions={canBeModified ? [
                                    <Button icon={<CheckCircleOutlined />} onClick={() => {
                                        setEditingItem(item);
                                        receiveItemForm.setFieldsValue({ quantity_received: item.quantity_expected - item.quantity_received, target_storage_cell_id: item.target_storage_cell?.id });
                                    }} disabled={item.quantity_received >= item.quantity_expected}>
                                        Принять
                                    </Button>
                                ] : [<Tag color="green">Принято</Tag>]}>
                                    <List.Item.Meta
                                        title={<Text delete={item.quantity_received >= item.quantity_expected}>{item.product.name}</Text>}
                                        description={`Арт: ${item.product.sku} | Ожидается: ${item.quantity_expected} | Принято: ${item.quantity_received}`}
                                    />
                                    {item.target_storage_cell && <Text type="secondary">Ячейка: {item.target_storage_cell.code}</Text>}
                                </List.Item>
                            )}
                        />
                        {canBeModified && <>
                            <Divider>Добавить товар в план</Divider>
                            <Form form={addItemForm} onFinish={handleAddItem} layout="inline">
                                <Form.Item name="product_id" rules={[{required: true}]} style={{flex: 1}}><Select showSearch placeholder="Выберите товар" optionFilterProp="children">{products.map(p => <Option key={p.id} value={p.id}>{p.name} ({p.sku})</Option>)}</Select></Form.Item>
                                <Form.Item name="quantity_expected" rules={[{required: true}]}><InputNumber min={1} placeholder="Кол-во"/></Form.Item>
                                <Form.Item><Button type="primary" htmlType="submit">Добавить</Button></Form.Item>
                            </Form>
                        </>}
                    </>}
                </Spin>
            </Modal>
            
            <Modal title={editingItem ? `Принять товар: ${editingItem.product.name}`: ''} open={!!editingItem} onCancel={() => setEditingItem(null)}
                onOk={() => receiveItemForm.submit()} confirmLoading={loadingDetails} okText="Оприходовать" destroyOnClose>
                <Form form={receiveItemForm} layout="vertical" onFinish={handleReceiveItem}>
                    <Form.Item label="Осталось принять">{editingItem && (editingItem.quantity_expected - editingItem.quantity_received)}</Form.Item>
                    <Form.Item name="quantity_received" label="Принимаемое количество" rules={[{required: true}]}>
                        <InputNumber min={1} max={editingItem ? (editingItem.quantity_expected - editingItem.quantity_received) : undefined} style={{width: '100%'}}/>
                    </Form.Item>
                    <Form.Item name="target_storage_cell_id" label="Разместить в ячейку" rules={[{required: true}]}>
                        <Select showSearch placeholder="Выберите ячейку" optionFilterProp="children">{storageCells.map(c => <Option key={c.id} value={c.id}>{c.code}</Option>)}</Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default InboundShipmentsPage;