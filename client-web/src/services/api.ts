const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5147/api';

// Helper to inject the token and adjust Content-Type
const getHeaders = (isFormData = false): Record<string, string> => {
  const token = localStorage.getItem('ik_jwt_token');
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const api = {
  get: async <T = any>(endpoint: string, options?: RequestInit): Promise<T> => {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          ...getHeaders(),
          ...(options?.headers as Record<string, string> || {})
        },
        ...options
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw { response: { data: errorData }, status: res.status };
      }

      return await res.json();
    } catch (err) {
      console.error("[API GET ERROR]", err);
      throw err;
    }
  },

  post: async <T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> => {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          ...(options?.headers as Record<string, string> || {})
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        ...options
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw { response: { data: errorData }, status: res.status };
      }

      return await res.json();
    } catch (err) {
      console.error("[API POST ERROR]", err);
      throw err;
    }
  },

  postFormData: async <T = any>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> => {
    try {
      // Do not set Content-Type header so the browser sets the multipart boundary automatically
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...getHeaders(true),
          ...(options?.headers as Record<string, string> || {})
        },
        body: formData,
        ...options
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw { response: { data: errorData }, status: res.status };
      }

      return await res.json();
    } catch (err) {
      console.error("[API FORMDATA ERROR]", err);
      throw err;
    }
  }
};