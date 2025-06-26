// frontend/src/pages/OutboundShipmentsPage.tsx
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import {
	Button,
	Col,
	DatePicker,
	Divider,
	Form, Input,
	InputNumber,
	List,
	message, Modal,
	Row,
	Select, Space, Spin, Table, Tag, Tooltip,
	Typography
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useCallback, useEffect, useState } from 'react'
import apiClient from '../api/apiClient'
import {
	addItemToOutboundShipmentApi,
	createOutboundShipmentApi, fetchOutboundShipmentById, fetchOutboundShipments,
	updateOutboundShipmentStatusApi
} from '../api/outboundShipmentService'
import { OrderStatus, type CreateOutboundShipmentDtoFE, type OutboundShipment, type OutboundShipmentItem, type Product } from '../types/entities'

const { Title, Text } = Typography;
const { Option } = Select;

// Интерфейс для данных формы создания
interface CreateOutboundShipmentFormValues {
    document_number: string;
    customer_details?: string;
    planned_shipping_date?: Dayjs;
    notes?: string;
}

const StatusTag: React.FC<{ status: OrderStatus }> = ({ status }) => {
    const statusMap = {
        [OrderStatus.NEW]: { color: 'default', text: 'Новый' },
        [OrderStatus.PENDING_ASSEMBLY]: { color: 'gold', text: 'Ожидает сборки' },
        [OrderStatus.ASSEMBLING]: { color: 'processing', text: 'В сборке' },
        [OrderStatus.READY_FOR_SHIPMENT]: { color: 'lime', text: 'Готов к отгрузке' },
        [OrderStatus.SHIPPED]: { color: 'success', text: 'Отгружен' },
        [OrderStatus.CANCELLED]: { color: 'error', text: 'Отменен' },
    };
    return <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>;
};

const OutboundShipmentsPage: React.FC = () => {
    const [shipments, setShipments] = useState<OutboundShipment[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    // ИСПРАВЛЕНО: Форма типизирована интерфейсом для формы
    const [createForm] = Form.useForm<CreateOutboundShipmentFormValues>();

    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<OutboundShipment | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    const [products, setProducts] = useState<Product[]>([]);
    const [addItemForm] = Form.useForm();

    const loadShipments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchOutboundShipments();
            setShipments(data);
        } catch (error) { message.error('Не удалось загрузить список отгрузок.'); }
        finally { setLoading(false); }
    }, []);

    const loadProducts = useCallback(async () => {
        try {
            if (products.length === 0) {
                const prodRes = await apiClient.get('/products/with-stock');
                setProducts(prodRes.data || []);
            }
        } catch { message.error("Ошибка загрузки товаров"); }
    }, [products.length]);

    useEffect(() => { loadShipments(); }, [loadShipments]);

    const refreshDetails = async (shipmentId: string) => {
        const details = await fetchOutboundShipmentById(shipmentId);
        setSelectedShipment(details);
        setShipments(prev => prev.map(s => s.id === shipmentId ? details : s));
    }

    const handleShowCreateModal = () => {
        createForm.resetFields();
        // ИСПРАВЛЕНО: Установка Dayjs объекта теперь типобезопасна
        createForm.setFieldsValue({
            document_number: `OUT-${dayjs().format('YYYYMMDD-HHmm')}`,
            planned_shipping_date: dayjs().add(1, 'day')
        });
        setIsCreateModalVisible(true);
    };

    // ИСПРАВЛЕНО: values имеет тип ...FormValues, а payload - ...DtoFE
    const handleCreateShipment = async (values: CreateOutboundShipmentFormValues) => {
        setLoading(true);
        try {
            const payload: CreateOutboundShipmentDtoFE = {
                ...values,
                planned_shipping_date: values.planned_shipping_date?.toISOString(),
            };
            await createOutboundShipmentApi(payload);
            message.success('Заказ на отгрузку успешно создан.');
            setIsCreateModalVisible(false);
            loadShipments();
        } catch (error: any) { message.error(error.response?.data?.message || 'Ошибка создания.'); }
        finally { setLoading(false); }
    };

    const handleShowDetails = async (shipmentId: string) => {
        await loadProducts();
        setIsDetailModalVisible(true);
        setLoadingDetails(true);
        try {
            await refreshDetails(shipmentId);
        } catch (error) {
            message.error('Не удалось загрузить детали.');
            setIsDetailModalVisible(false);
        } finally {
            setLoadingDetails(false);
        }
    };
    
    const handleAddItem = async (values: any) => {
        if (!selectedShipment) return;
        setLoadingDetails(true);
        try {
            await addItemToOutboundShipmentApi(selectedShipment.id, values);
            await refreshDetails(selectedShipment.id);
            addItemForm.resetFields();
            message.success('Товар добавлен в заказ.');
        } catch (error: any) { message.error(error.response?.data?.message || 'Ошибка добавления товара.'); }
        finally { setLoadingDetails(false); }
    };
    
    const handleUpdateStatus = async (status: OrderStatus) => {
        if(!selectedShipment) return;
        setLoadingDetails(true);
        try {
            await updateOutboundShipmentStatusApi(selectedShipment.id, status);
            await refreshDetails(selectedShipment.id);
            message.success("Статус заказа обновлен.");
        } catch (error: any) { message.error(error.response?.data?.message || 'Ошибка обновления статуса.'); }
        finally { setLoadingDetails(false); }
    }

    const columns: ColumnsType<OutboundShipment> = [
        { title: 'Номер заказа', dataIndex: 'document_number', key: 'doc_number' },
        { title: 'Клиент', dataIndex: 'customer_details', key: 'customer' },
        { title: 'Дата отгрузки (план)', dataIndex: 'planned_shipping_date', key: 'date', render: (date) => date ? dayjs(date).format('DD.MM.YYYY') : '–' },
        { title: 'Статус', dataIndex: 'status', key: 'status', render: (status: OrderStatus) => <StatusTag status={status} /> },
        {
            title: 'Действия', key: 'actions', align: 'center',
            render: (_, record) => (<Tooltip title="Детали заказа"><Button shape="circle" icon={<EyeOutlined />} onClick={() => handleShowDetails(record.id)} /></Tooltip>),
        },
    ];
    
    const canBeModified = selectedShipment?.status === OrderStatus.NEW;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Title level={2} style={{ margin: 0 }}>Отгрузка товаров</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleShowCreateModal}>Создать заказ</Button>
            </div>
            <Spin spinning={loading}>
                <Table columns={columns} dataSource={shipments} rowKey="id" bordered size="middle" />
            </Spin>

            <Modal title="Новый заказ на отгрузку" open={isCreateModalVisible} onCancel={() => setIsCreateModalVisible(false)} onOk={() => createForm.submit()} confirmLoading={loading} >
                <Form form={createForm} layout="vertical" onFinish={handleCreateShipment}>
                    <Form.Item name="document_number" label="Номер документа" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="customer_details" label="Клиент (получатель)" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="planned_shipping_date" label="Планируемая дата отгрузки"><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="notes" label="Примечание"><Input.TextArea rows={2} /></Form.Item>
                </Form>
            </Modal>
            
            <Modal title={selectedShipment ? `Заказ №${selectedShipment.document_number}` : 'Детали'} open={isDetailModalVisible} width={1000} onCancel={() => setIsDetailModalVisible(false)} footer={null} destroyOnClose>
                <Spin spinning={loadingDetails}>
                    {selectedShipment && <>
                        <Row gutter={16} style={{marginBottom: 16}}>
                           <Col span={12}><Text strong>Клиент:</Text> {selectedShipment.customer_details}</Col>
                           <Col span={12}><Text strong>Статус:</Text> <StatusTag status={selectedShipment.status}/></Col>
                        </Row>
                        <Divider>Товары в заказе</Divider>
                        <List
                            itemLayout="horizontal"
                            dataSource={selectedShipment.items}
                            renderItem={(item: OutboundShipmentItem) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={item.product.name}
                                        description={`Арт: ${item.product.sku} | Заказано: ${item.quantity_ordered} | Отгружено: ${item.quantity_shipped}`}
                                    />
                                </List.Item>
                            )}
                        />
                        {canBeModified && <>
                            <Divider>Добавить товар в заказ</Divider>
                            <Form form={addItemForm} onFinish={handleAddItem} layout="inline">
                                <Form.Item name="product_id" rules={[{required: true}]} style={{flex: 1}}><Select showSearch placeholder="Выберите товар">{products.map(p => <Option key={p.id} value={p.id} disabled={(p.total_stock || 0) <= 0}>{`${p.name} (Остаток: ${p.total_stock || 0})`}</Option>)}</Select></Form.Item>
                                <Form.Item name="quantity_ordered" rules={[{required: true}]}><InputNumber min={1} placeholder="Кол-во"/></Form.Item>
                                <Form.Item><Button type="primary" htmlType="submit">Добавить</Button></Form.Item>
                            </Form>
                        </>}
                        <Divider />
                        <Space wrap>
                            <Text strong>Управление заказом:</Text>
                            {selectedShipment.status === OrderStatus.NEW && <Button onClick={()=>handleUpdateStatus(OrderStatus.PENDING_ASSEMBLY)}>Передать в сборку</Button>}
                            {selectedShipment.status === OrderStatus.PENDING_ASSEMBLY && <Button onClick={()=>handleUpdateStatus(OrderStatus.ASSEMBLING)}>Начать сборку</Button>}
                            {selectedShipment.status === OrderStatus.ASSEMBLING && <Button onClick={()=>handleUpdateStatus(OrderStatus.READY_FOR_SHIPMENT)}>Завершить сборку</Button>}
                            {selectedShipment.status === OrderStatus.READY_FOR_SHIPMENT && <Button type='primary' onClick={()=>handleUpdateStatus(OrderStatus.SHIPPED)}>Отгрузить</Button>}
                            {canBeModified && <Button danger onClick={()=>handleUpdateStatus(OrderStatus.CANCELLED)}>Отменить заказ</Button>}
                        </Space>
                    </>}
                </Spin>
            </Modal>
        </div>
    );
};

export default OutboundShipmentsPage;