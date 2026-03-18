import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

export class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function useApiClient() {
  const { getToken, signOut } = useAuth();
  const router = useRouter();

  async function request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    body?: unknown
  ): Promise<T> {
    const token = await getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      await signOut();
      router.replace('/(auth)/sign-in');
      throw new ApiError('Unauthorized', 401);
    }

    const data = await response.json() as { error?: string; code?: string };

    if (!response.ok) {
      throw new ApiError(data.error || 'Request failed', response.status, data.code);
    }

    return data as T;
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
    request,
  };
}
