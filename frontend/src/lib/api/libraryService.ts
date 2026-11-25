import api from './client';
import { buildApiUrl } from './config';
import { API_ENDPOINTS } from './endpoints';
import type { GutendexResponse } from './types';

export interface GutendexParams {
  page?: number;
  search?: string;
  topic?: string;
  languages?: string;
  sort?: string;
}

export const libraryService = {
  async gutendex(params: GutendexParams = {}): Promise<GutendexResponse> {
    const { data } = await api.get<GutendexResponse>(API_ENDPOINTS.library.gutendex, { params });
    return data;
  },

  /** Backend proxy keeps remote cover requests allow-listed. */
  coverProxyUrl(remoteUrl: string): string {
    return buildApiUrl(
      `${API_ENDPOINTS.library.covers}?url=${encodeURIComponent(remoteUrl)}`
    );
  },

  /** Fallback artwork lookup for book records whose stored cover URL is unavailable. */
  coverLookupUrl(title: string, author?: string): string {
    const params = new URLSearchParams({ title });
    if (author) params.set('author', author);
    return buildApiUrl(`${API_ENDPOINTS.library.covers}?${params.toString()}`);
  },

  /** Backend streams the ebook and sets the download filename. */
  ebookDownloadUrl(remoteUrl: string, title: string): string {
    return buildApiUrl(
      `${API_ENDPOINTS.library.ebookDownload}?url=${encodeURIComponent(remoteUrl)}&title=${encodeURIComponent(title)}`
    );
  },

  openApiSpecUrl(): string {
    return buildApiUrl(API_ENDPOINTS.system.openapi);
  },
};
