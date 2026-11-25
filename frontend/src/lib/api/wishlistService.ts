import api from './client';
import { API_ENDPOINTS } from './endpoints';
import type { ApiEnvelope } from './types';

export interface WishlistResponse extends ApiEnvelope<string[]> {
  data: string[];
}

export const wishlistService = {
  async get(): Promise<WishlistResponse> {
    const { data } = await api.get<WishlistResponse>(API_ENDPOINTS.wishlist.root);
    return data;
  },

  async save(bookIds: string[]): Promise<WishlistResponse> {
    const { data } = await api.post<WishlistResponse>(API_ENDPOINTS.wishlist.root, { bookIds });
    return data;
  },

  async add(bookId: string): Promise<WishlistResponse> {
    const { data } = await api.post<WishlistResponse>(API_ENDPOINTS.wishlist.root, { bookId });
    return data;
  },

  async remove(bookId: string): Promise<WishlistResponse> {
    const { data } = await api.delete<WishlistResponse>(API_ENDPOINTS.wishlist.item(bookId));
    return data;
  },
};
