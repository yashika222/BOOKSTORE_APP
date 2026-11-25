import api from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  BookListParams,
  BookListResponse,
  BookResponse,
  ICommercialBook,
  RelatedBooksResponse,
} from './types';

export const booksService = {
  async list(params: BookListParams = {}, signal?: AbortSignal): Promise<BookListResponse> {
    const { data } = await api.get<BookListResponse>(API_ENDPOINTS.books.list, {
      params,
      signal,
    });
    return data;
  },

  async getById(id: string | number): Promise<BookResponse> {
    const { data } = await api.get<BookResponse>(API_ENDPOINTS.books.byId(id));
    return data;
  },

  async getByIsbn(isbn: string): Promise<BookResponse> {
    const { data } = await api.get<BookResponse>(API_ENDPOINTS.books.byIsbn(isbn));
    return data;
  },

  async related(params: {
    source?: string;
    id?: string;
    topic?: string;
    genre?: string;
  }): Promise<RelatedBooksResponse> {
    const { data } = await api.get<RelatedBooksResponse>(API_ENDPOINTS.books.related, {
      params,
    });
    return data;
  },

  async create(payload: Partial<ICommercialBook>): Promise<BookResponse> {
    const { data } = await api.post<BookResponse>(API_ENDPOINTS.books.list, payload);
    return data;
  },

  async update(
    id: string | number,
    payload: Partial<ICommercialBook>
  ): Promise<BookResponse> {
    const { data } = await api.patch<BookResponse>(API_ENDPOINTS.books.byId(id), payload);
    return data;
  },

  async remove(id: string | number): Promise<BookResponse> {
    const { data } = await api.delete<BookResponse>(API_ENDPOINTS.books.byId(id));
    return data;
  },
};
