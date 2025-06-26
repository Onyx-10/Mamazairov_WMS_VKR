import type {
	AddOutboundShipmentItemDtoFE,
	CreateOutboundShipmentDtoFE,
	OutboundShipment,
	OutboundShipmentItem,
} from '../types/entities'
import apiClient from './apiClient'

// Получить все отгрузки
export const fetchOutboundShipments = async (): Promise<OutboundShipment[]> => {
  const response = await apiClient.get('/outbound-shipments');
  return response.data;
};

// Получить одну отгрузку по ID
export const fetchOutboundShipmentById = async (id: string): Promise<OutboundShipment> => {
  const response = await apiClient.get(`/outbound-shipments/${id}`);
  return response.data;
};

// Создать новую отгрузку
export const createOutboundShipmentApi = async (data: CreateOutboundShipmentDtoFE): Promise<OutboundShipment> => {
  const response = await apiClient.post('/outbound-shipments', data);
  return response.data;
};

// Удалить отгрузку
export const deleteOutboundShipmentApi = async (id: string): Promise<void> => {
  await apiClient.delete(`/outbound-shipments/${id}`);
};

// Обновить статус отгрузки
export const updateOutboundShipmentStatusApi = async (id: string, status: string): Promise<OutboundShipment> => {
    const response = await apiClient.patch(`/outbound-shipments/${id}/status`, { status });
    return response.data;
};

// Добавить товар в отгрузку
export const addItemToOutboundShipmentApi = async (shipmentId: string, item: AddOutboundShipmentItemDtoFE): Promise<OutboundShipmentItem> => {
  const response = await apiClient.post(`/outbound-shipments/${shipmentId}/items`, item);
  return response.data;
};

// Удалить товар из отгрузки
export const removeItemFromOutboundShipmentApi = async (shipmentId: string, itemId: string): Promise<void> => {
  await apiClient.delete(`/outbound-shipments/${shipmentId}/items/${itemId}`);
};