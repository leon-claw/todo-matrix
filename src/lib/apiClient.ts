import { CapacitorHttp } from '@capacitor/core';

const configuredGlobalApiBase =
  typeof __TODO_MATRIX_API_BASE_URL__ === 'undefined' ? '' : __TODO_MATRIX_API_BASE_URL__;
const configuredApiBase = (configuredGlobalApiBase || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const API_BASE = configuredApiBase || (import.meta.env.PROD ? __TODO_MATRIX_API_BASE_FALLBACK__ : '');

const NETWORK_STATUS_EVENT = 'todo-matrix:network-status';
const MOBILE_SESSION_TOKEN_KEY = 'todo-matrix:mobile-session-token';
const CLIENT_SESSION_HINT_KEY = 'todo-matrix:client-session-present';

function isCapacitorNative() {
  if (typeof window === 'undefined') {
    return false;
  }

  const capacitor = window.Capacitor;
  if (!capacitor) {
    return false;
  }

  if (typeof capacitor.isNativePlatform === 'function') {
    return capacitor.isNativePlatform();
  }

  return Boolean(capacitor.platform && capacitor.platform !== 'web');
}

function isCrossOriginApiBase() {
  if (typeof window === 'undefined' || !API_BASE || !/^https?:\/\//i.test(API_BASE)) {
    return false;
  }

  try {
    return new URL(API_BASE).origin !== window.location.origin;
  } catch {
    return false;
  }
}

function shouldUseClientSessionToken() {
  return isCapacitorNative() || isCrossOriginApiBase();
}

function readMobileSessionToken() {
  if (!shouldUseClientSessionToken()) {
    return null;
  }

  return localStorage.getItem(MOBILE_SESSION_TOKEN_KEY);
}

export function hasClientSessionHint() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(
    localStorage.getItem(MOBILE_SESSION_TOKEN_KEY) || localStorage.getItem(CLIENT_SESSION_HINT_KEY),
  );
}

export function markClientSessionPresent() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(CLIENT_SESSION_HINT_KEY, '1');
}

export function saveMobileSessionToken(token: string | null | undefined) {
  if (typeof window === 'undefined' || !token) {
    return;
  }

  markClientSessionPresent();
  if (!shouldUseClientSessionToken()) {
    return;
  }

  localStorage.setItem(MOBILE_SESSION_TOKEN_KEY, token);
}

export function clearMobileSessionToken() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(MOBILE_SESSION_TOKEN_KEY);
  localStorage.removeItem(CLIENT_SESSION_HINT_KEY);
}

function emitNetworkStatus(online: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(NETWORK_STATUS_EVENT, { detail: { online } }));
}

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

  const apiPath = url.startsWith('/') ? url : `/${url}`;
  if (API_BASE.endsWith('/api') && apiPath.startsWith('/api/')) {
    return `${API_BASE}${apiPath.slice('/api'.length)}`;
  }

  return `${API_BASE}${apiPath}`;
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

  const response = await bridge
    .apiRequest<T>({
      body: options.body,
      headers: normalizeHeaders(options.headers),
      method: options.method,
      url,
    })
    .catch((error) => {
      emitNetworkStatus(false);
      throw error;
    });

  emitNetworkStatus(response.status !== 0);

  if (!response.ok) {
    throw new ApiError(response.status, readErrorMessage(response.payload, response.statusText || 'Request failed'));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.payload as T;
}

async function mobileApiRequest<T>(url: string, options: RequestOptions) {
  const mobileSessionToken = readMobileSessionToken();
  const headers = {
    ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...(mobileSessionToken ? { Authorization: `Bearer ${mobileSessionToken}` } : {}),
    ...(normalizeHeaders(options.headers) ?? {}),
  };

  const response = await CapacitorHttp.request({
    data: options.body,
    headers,
    method: options.method ?? 'GET',
    responseType: 'json',
    url: buildApiUrl(url),
  }).catch((error) => {
    emitNetworkStatus(false);
    throw error;
  });

  emitNetworkStatus(true);

  if (response.status < 200 || response.status >= 300) {
    throw new ApiError(response.status, readErrorMessage(response.data, response.status ? `HTTP ${response.status}` : 'Request failed'));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.data as T;
}

export async function apiRequest<T>(url: string, options: RequestOptions = {}) {
  if (typeof window !== 'undefined' && window.todoMatrixDesktop?.isDesktop) {
    return desktopApiRequest<T>(url, options);
  }

  if (isCapacitorNative()) {
    return mobileApiRequest<T>(url, options);
  }

  const mobileSessionToken = readMobileSessionToken();

  const response = await fetch(buildApiUrl(url), {
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'include',
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(mobileSessionToken ? { Authorization: `Bearer ${mobileSessionToken}` } : {}),
      ...options.headers,
    },
  }).catch((error) => {
    emitNetworkStatus(false);
    throw error;
  });

  emitNetworkStatus(true);

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
