import type {
	AddInboundShipmentItemDtoFE,
	CreateInboundShipmentDtoFE,
	InboundShipment,
	InboundShipmentItem,
	UpdateInboundShipmentItemDtoFE,
} from '../types/entities'
import apiClient from './apiClient'

// Получить все приёмки
export const fetchInboundShipments = async (): Promise<InboundShipment[]> => {
  const response = await apiClient.get('/inbound-shipments');
  return response.data;
};

// Получить одну приёмку по ID
export const fetchInboundShipmentById = async (id: string): Promise<InboundShipment> => {
  const response = await apiClient.get(`/inbound-shipments/${id}`);
  return response.data;
};

// Создать новую приёмку
export const createInboundShipmentApi = async (data: CreateInboundShipmentDtoFE): Promise<InboundShipment> => {
  const response = await apiClient.post('/inbound-shipments', data);
  return response.data;
};

// Удалить приёмку
export const deleteInboundShipmentApi = async (id: string): Promise<void> => {
  await apiClient.delete(`/inbound-shipments/${id}`);
};

// Обновить статус приёмки
export const updateInboundShipmentStatusApi = async (id:string, status: string): Promise<InboundShipment> => {
    const response = await apiClient.patch(`/inbound-shipments/${id}/status`, { status });
    return response.data;
};

// Добавить товар в приёмку
export const addItemToInboundShipmentApi = async (shipmentId: string, item: AddInboundShipmentItemDtoFE): Promise<InboundShipmentItem> => {
  const response = await apiClient.post(`/inbound-shipments/${shipmentId}/items`, item);
  return response.data;
};

// Обновить товар в приёмке (для оприходования)
export const updateInboundShipmentItemApi = async (shipmentId: string, itemId: string, data: UpdateInboundShipmentItemDtoFE): Promise<InboundShipmentItem> => {
    const response = await apiClient.patch(`/inbound-shipments/${shipmentId}/items/${itemId}`, data);
    return response.data;
};

// Удалить товар из приёмки
export const removeItemFromInboundShipmentApi = async (shipmentId: string, itemId: string): Promise<void> => {
  await apiClient.delete(`/inbound-shipments/${shipmentId}/items/${itemId}`);
};