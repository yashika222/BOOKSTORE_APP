import api from './client';
import type { AxiosResponse } from 'axios';

type DocsMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export const docsService = {
  /** Used only by the in-app API explorer. Paths come from API_ENDPOINTS. */
  async testEndpoint(
    method: DocsMethod,
    path: string,
    body?: unknown
  ): Promise<AxiosResponse> {
    if (method === 'GET') return api.get(path);
    if (method === 'DELETE') return api.delete(path);
    return api.request({ method, url: path, data: body ?? {} });
  },
};
