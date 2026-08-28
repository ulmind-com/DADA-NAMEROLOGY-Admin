const RAW_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';
export const API_BASE = RAW_BASE.replace(/\/$/, '');

const ACCESS = 'dada.admin.access';
const REFRESH = 'dada.admin.refresh';

export const tokens = {
  get access() {
    return localStorage.getItem(ACCESS);
  },
  get refresh() {
    return localStorage.getItem(REFRESH);
  },
  save(access: string, refresh: string) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const rt = tokens.refresh;
    if (!rt) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      tokens.save(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

type Opts = RequestInit & { auth?: boolean; blob?: boolean };

export async function api<T = any>(path: string, opts: Opts = {}, retry = true): Promise<T> {
  const { auth = true, blob = false, ...init } = opts;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Cannot reach the API server.', 0);
  }

  if (res.status === 401 && auth && retry) {
    if (await refreshSession()) return api<T>(path, opts, false);
    tokens.clear();
    if (!location.pathname.startsWith('/login')) location.href = '/login';
  }

  if (blob) {
    if (!res.ok) throw new ApiError('Download failed.', res.status);
    return (await res.blob()) as unknown as T;
  }
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.message || data?.detail || 'Request failed.', res.status);
  return data as T;
}

export const get = <T = any>(p: string) => api<T>(p);
export const post = <T = any>(p: string, body?: unknown, o: Opts = {}) =>
  api<T>(p, { ...o, method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
export const put = <T = any>(p: string, body?: unknown) =>
  api<T>(p, { method: 'PUT', body: JSON.stringify(body) });
export const patch = <T = any>(p: string, body?: unknown) =>
  api<T>(p, { method: 'PATCH', body: JSON.stringify(body) });
export const del = <T = any>(p: string) => api<T>(p, { method: 'DELETE' });

/** Opens an authenticated PDF in a new tab. */
export async function openPdf(path: string) {
  const blob = await api<Blob>(path, { blob: true });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
