const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

export const API_BASE = configuredApiBase || (import.meta.env.PROD ? '/app/todo-matrix' : '');

function readErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === 'string' && error) {
      return error;
    }
  }

  return fallback;
}

function buildApiUrl(url: string) {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  if (!API_BASE) {
    return url;
  }

  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

function normalizeHeaders(headers: HeadersInit | undefined) {
  if (!headers) {
    return undefined;
  }

  return Object.fromEntries(new Headers(headers).entries());
}

async function desktopApiRequest<T>(url: string, options: RequestOptions) {
  const bridge = window.todoMatrixDesktop;
  if (!bridge) {
    throw new ApiError(500, 'Desktop bridge is unavailable');
  }

  const response = await bridge.apiRequest<T>({
    body: options.body,
    headers: normalizeHeaders(options.headers),
    method: options.method,
    url,
  });

  if (!response.ok) {
    throw new ApiError(response.status, readErrorMessage(response.payload, response.statusText || 'Request failed'));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.payload as T;
}

export async function apiRequest<T>(url: string, options: RequestOptions = {}) {
  if (typeof window !== 'undefined' && window.todoMatrixDesktop?.isDesktop) {
    return desktopApiRequest<T>(url, options);
  }

  const response = await fetch(buildApiUrl(url), {
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'include',
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = response.statusText || 'Request failed';
    try {
      const payload = await response.json();
      message = readErrorMessage(payload, message);
    } catch {
      // Keep the HTTP status text when the response has no JSON body.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
