import type { PublicProperty } from '@rentr/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env['API_BASE_URL'] ??
  'http://localhost:3001/api';

export interface UploadedPropertyImage {
  url: string;
  alt: string;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(' ')
      : typeof body?.message === 'string'
        ? body.message
        : `API request failed with status ${response.status}.`;
    throw new Error(message);
  }
  return (await response.json()) as T;
}

let refreshPromise: Promise<void> | null = null;

function shouldRefreshSession(path: string): boolean {
  return !(path === '/auth/refresh' || path === '/auth/logout' || path.startsWith('/auth/otp/'));
}

async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(readJson<{ accessToken: string }>)
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function fetchWithSession(path: string, init: RequestInit): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  const request = (): Promise<Response> => fetch(url, { ...init, credentials: 'include' });
  const response = await request();
  if (response.status !== 401 || !shouldRefreshSession(path)) return response;

  try {
    await refreshSession();
  } catch {
    return response;
  }
  return request();
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetchWithSession(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
  });
  return readJson<T>(response);
}

export async function uploadPropertyImages(
  files: readonly File[],
): Promise<UploadedPropertyImage[]> {
  if (files.length === 0) return [];

  const formData = new FormData();
  for (const file of files) formData.append('images', file, file.name);
  const response = await fetchWithSession('/properties/images', {
    method: 'POST',
    body: formData,
  });
  return readJson<UploadedPropertyImage[]>(response);
}

export async function getPublishedProperties(): Promise<PublicProperty[]> {
  const response = await fetch(`${API_BASE_URL}/properties`, { cache: 'no-store' });
  return readJson<PublicProperty[]>(response);
}

export async function getPublicProperty(id: string): Promise<PublicProperty | null> {
  const response = await fetch(`${API_BASE_URL}/properties/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  return readJson<PublicProperty>(response);
}
