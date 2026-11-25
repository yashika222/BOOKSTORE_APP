import api from './client';
import { API_ENDPOINTS } from './endpoints';
import type { AddressListResponse, AddressPayload, AddressResponse } from './types';

export const addressesService = {
  async list(): Promise<AddressListResponse> {
    const { data } = await api.get<AddressListResponse>(API_ENDPOINTS.addresses.root);
    return data;
  },

  async create(payload: AddressPayload): Promise<AddressResponse> {
    const { data } = await api.post<AddressResponse>(API_ENDPOINTS.addresses.root, payload);
    return data;
  },

  async update(id: string, payload: AddressPayload): Promise<AddressResponse> {
    const { data } = await api.put<AddressResponse>(API_ENDPOINTS.addresses.byId(id), payload);
    return data;
  },

  async remove(id: string): Promise<AddressResponse> {
    const { data } = await api.delete<AddressResponse>(API_ENDPOINTS.addresses.byId(id));
    return data;
  },
};
