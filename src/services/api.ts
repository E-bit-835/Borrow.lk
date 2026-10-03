/**
 * Centralized API Client for BorrowLK
 * Connects frontend to backend REST APIs (which interact with NeonDB PostgreSQL)
 */

function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, '');
  }
  // In Vite dev, use same-origin /api (proxied to Express) to avoid Failed to fetch / CORS
  if (import.meta.env.DEV) {
    return '/api';
  }
  return 'http://localhost:5000/api';
}

export const API_BASE_URL = resolveApiBaseUrl();

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiClient {
  private getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
    const token = localStorage.getItem('borrowlk_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async safeFetch(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (err?.name === 'TypeError' || /failed to fetch|networkerror|load failed/i.test(msg)) {
        throw new Error(
          'Cannot reach the BorrowLK API. Make sure the backend is running (npm run dev) on port 5000.'
        );
      }
      throw err;
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const res = await this.safeFetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(res);
  }

  async post<T = any>(endpoint: string, body?: any): Promise<T> {
    const res = await this.safeFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(res);
  }

  async put<T = any>(endpoint: string, body?: any): Promise<T> {
    const res = await this.safeFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(res);
  }

  async patch<T = any>(endpoint: string, body?: any): Promise<T> {
    const res = await this.safeFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(res);
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const res = await this.safeFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(res);
  }

  async uploadFile<T = any>(endpoint: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem('borrowlk_auth_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await this.safeFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(res);
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    let json: ApiResponse<T>;
    try {
      json = await res.json();
    } catch {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }

    if (!res.ok || !json.success) {
      const errorMsg = json.error?.message || `Request failed with status ${res.status}`;
      const error: any = new Error(errorMsg);
      error.code = json.error?.code || 'API_ERROR';
      error.status = res.status;
      error.details = json.error?.details;
      throw error;
    }

    return json.data;
  }
}

export const api = new ApiClient();
