import api from './client';
import { API_ENDPOINTS } from './endpoints';
import type { CreateOrderPayload, OrderListResponse, OrderResponse } from './types';

export const ordersService = {
  async list(): Promise<OrderListResponse> {
    const { data } = await api.get<OrderListResponse>(API_ENDPOINTS.orders.root);
    return data;
  },

  async get(orderId: string): Promise<OrderResponse> {
    const { data } = await api.get<OrderResponse>(API_ENDPOINTS.orders.byId(orderId));
    return data;
  },

  async create(payload: CreateOrderPayload): Promise<OrderResponse> {
    const { data } = await api.post<OrderResponse>(API_ENDPOINTS.orders.root, payload);
    return data;
  },
};
