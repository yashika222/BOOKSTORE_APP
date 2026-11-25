import api from './client';
import { API_ENDPOINTS } from './endpoints';
import type { ApiEnvelope } from './types';

export interface ServerCartItem {
  bookId: string;
  qty: number;
  savedForLater?: boolean;
}

export interface CartResponse extends ApiEnvelope<ServerCartItem[]> {
  data: ServerCartItem[];
}

export const cartService = {
  async get(): Promise<CartResponse> {
    const { data } = await api.get<CartResponse>(API_ENDPOINTS.cart.root);
    return data;
  },

  async save(items: ServerCartItem[]): Promise<CartResponse> {
    const { data } = await api.post<CartResponse>(API_ENDPOINTS.cart.root, { items });
    return data;
  },

  async updateItem(
    itemId: string | number,
    payload: { qty: number; savedForLater?: boolean }
  ): Promise<CartResponse> {
    const { data } = await api.patch<CartResponse>(API_ENDPOINTS.cart.item(itemId), payload);
    return data;
  },

  async removeItem(itemId: string | number): Promise<CartResponse> {
    const { data } = await api.delete<CartResponse>(API_ENDPOINTS.cart.item(itemId));
    return data;
  },
};
