import api from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  AccountUpdateResponse,
  ChangePasswordPayload,
  RecentBooksResponse,
  UpdateProfilePayload,
} from './types';

export const accountService = {
  async updateProfile(payload: UpdateProfilePayload): Promise<AccountUpdateResponse> {
    const { data } = await api.patch<AccountUpdateResponse>(API_ENDPOINTS.account.root, payload);
    return data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<AccountUpdateResponse> {
    const { data } = await api.patch<AccountUpdateResponse>(API_ENDPOINTS.account.root, payload);
    return data;
  },

  async getRecentBooks(): Promise<RecentBooksResponse> {
    const { data } = await api.get<RecentBooksResponse>(API_ENDPOINTS.account.recent);
    return data;
  },

  async addRecentBook(payload: {
    bookId: string;
    source: 'store' | 'gutendex';
    title: string;
    author?: string;
    coverImage?: string;
  }): Promise<RecentBooksResponse> {
    const { data } = await api.post<RecentBooksResponse>(API_ENDPOINTS.account.recent, payload);
    return data;
  },
};
