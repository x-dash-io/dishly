import { useAuth } from '@clerk/clerk-expo';
import { useRouter, usePathname } from 'expo-router';

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
  const pathname = usePathname();

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

    const data = await response.json() as { error?: string; detail?: string; code?: string };

    if (response.status === 401) {
      console.log(`API: 401 Unauthorized - signing out and redirecting. Detail: ${data.detail}`);
      await signOut();
      router.replace('/(auth)/sign-in');
      throw new ApiError(data.error || 'Unauthorized', 401);
    }

    if (response.status === 403) {
      console.log('API: 403 Forbidden - potential onboarding required');
      if (pathname !== '/onboarding') {
        router.replace('/(auth)/onboarding');
      }
    }

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
