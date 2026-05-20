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

export async function apiRequest<T>(url: string, options: RequestOptions = {}) {
  const response = await fetch(url, {
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
      const payload = (await response.json()) as { error?: string };
      message = payload.error || message;
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
