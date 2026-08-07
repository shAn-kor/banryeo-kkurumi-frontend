export type ApiErrorKind = 'unauthorized' | 'forbidden' | 'conflict' | 'validation' | 'server' | 'network';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;

  constructor(kind: ApiErrorKind, status: number) {
    super(kind);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export type CsrfToken = Readonly<{ headerName: string; parameterName: string; token: string }>;

type ApiEnvelope<T> = { data?: T };
type RequestOptions = Omit<RequestInit, 'body' | 'headers' | 'method'> & {
  body?: unknown;
  headers?: HeadersInit;
  method?: string;
};

const API_PREFIX = '/api/';
const CSRF_PATH = '/api/v1/auth/csrf';
const LOGOUT_PATH = '/api/v1/auth/logout';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function resolveApiUrl(path: string): URL {
  const origin = window.location.origin;
  const url = new URL(path, origin);
  if (url.origin !== origin || !url.pathname.startsWith(API_PREFIX)) {
    throw new TypeError('API requests must use a same-origin /api path.');
  }
  return url;
}

function unwrap<T>(payload: unknown): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

function asCsrfToken(payload: unknown): CsrfToken | undefined {
  const value = unwrap<unknown>(payload);
  if (typeof value !== 'object' || value === null) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.headerName !== 'string' || typeof record.parameterName !== 'string' || typeof record.token !== 'string') {
    return undefined;
  }
  return { headerName: record.headerName, parameterName: record.parameterName, token: record.token };
}

function errorKind(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 409) return 'conflict';
  if (status === 422) return 'validation';
  return 'server';
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('application/json') ? response.json() : undefined;
}

export class ApiClient {
  private csrfToken: CsrfToken | undefined;

  async acquireCsrfToken(): Promise<CsrfToken> {
    const payload = await this.fetchJson<unknown>(CSRF_PATH, { method: 'GET' });
    const token = asCsrfToken(payload);
    if (!token) throw new ApiError('server', 500);
    this.csrfToken = token;
    return token;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const method = (options.method ?? 'GET').toUpperCase();
    if (UNSAFE_METHODS.has(method) && !this.csrfToken) await this.acquireCsrfToken();
    const payload = await this.fetchJson<unknown>(path, options);
    const rotated = asCsrfToken(payload);
    if (rotated) this.csrfToken = rotated;
    return unwrap<T>(payload);
  }

  private async fetchJson<T>(path: string, options: RequestOptions): Promise<T> {
    const url = resolveApiUrl(path);
    const method = (options.method ?? 'GET').toUpperCase();
    const headers = new Headers(options.headers);
    if (options.body !== undefined) headers.set('content-type', 'application/json');
    if (UNSAFE_METHODS.has(method) && this.csrfToken) headers.set(this.csrfToken.headerName, this.csrfToken.token);

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        credentials: 'include',
      });
      if (!response.ok) throw new ApiError(errorKind(response.status), response.status);
      const payload = await readPayload(response);
      if (method === 'POST' && url.pathname === LOGOUT_PATH && response.status === 204) this.csrfToken = undefined;
      return payload as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('network', 0);
    }
  }
}

export const apiClient = new ApiClient();
