import { CapacitorHttp } from '@capacitor/core';
import { createClientSessionStorageKeys, getActiveApiBase, normalizeServerApiBase } from './serverConfig';

export const API_BASE = getActiveApiBase();

const NETWORK_STATUS_EVENT = 'todo-matrix:network-status';
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

function isCrossOriginApiBase(apiBaseUrl = getActiveApiBase()) {
  if (typeof window === 'undefined' || !apiBaseUrl || !/^https?:\/\//i.test(apiBaseUrl)) {
    return false;
  }

  try {
    return new URL(apiBaseUrl).origin !== window.location.origin;
  } catch {
    return false;
  }
}

function shouldUseClientSessionToken(apiBaseUrl = getActiveApiBase()) {
  return isCapacitorNative() || isCrossOriginApiBase(apiBaseUrl);
}

function readMobileSessionToken(apiBaseUrl = getActiveApiBase()) {
  if (!shouldUseClientSessionToken(apiBaseUrl)) {
    return null;
  }

  const keys = createClientSessionStorageKeys(apiBaseUrl);
  return localStorage.getItem(keys.token) || localStorage.getItem(keys.legacyToken);
}

export function hasClientSessionHint() {
  if (typeof window === 'undefined') {
    return false;
  }

  const keys = createClientSessionStorageKeys(getActiveApiBase());
  return Boolean(
    localStorage.getItem(keys.token) ||
      localStorage.getItem(keys.hint) ||
      localStorage.getItem(keys.legacyToken) ||
      localStorage.getItem(keys.legacyHint),
  );
}

export function markClientSessionPresent() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(createClientSessionStorageKeys(getActiveApiBase()).hint, '1');
}

export function saveMobileSessionToken(token: string | null | undefined) {
  if (typeof window === 'undefined' || !token) {
    return;
  }

  markClientSessionPresent();
  const apiBaseUrl = getActiveApiBase();
  if (!shouldUseClientSessionToken(apiBaseUrl)) {
    return;
  }

  localStorage.setItem(createClientSessionStorageKeys(apiBaseUrl).token, token);
}

export function clearMobileSessionToken() {
  if (typeof window === 'undefined') {
    return;
  }

  const keys = createClientSessionStorageKeys(getActiveApiBase());
  localStorage.removeItem(keys.token);
  localStorage.removeItem(keys.hint);
  localStorage.removeItem(keys.legacyToken);
  localStorage.removeItem(keys.legacyHint);
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

function buildApiUrl(url: string, apiBaseUrl = getActiveApiBase()) {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  if (!apiBaseUrl) {
    return url;
  }

  const apiPath = url.startsWith('/') ? url : `/${url}`;
  if (apiBaseUrl.endsWith('/api') && apiPath.startsWith('/api/')) {
    return `${apiBaseUrl}${apiPath.slice('/api'.length)}`;
  }

  return `${apiBaseUrl}${apiPath}`;
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
  apiBaseUrl?: string;
  body?: unknown;
  skipAuth?: boolean;
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
      apiBaseUrl: options.apiBaseUrl ?? getActiveApiBase(),
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
  const apiBaseUrl = options.apiBaseUrl ?? getActiveApiBase();
  const mobileSessionToken = options.skipAuth ? null : readMobileSessionToken(apiBaseUrl);
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
    url: buildApiUrl(url, apiBaseUrl),
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

  const apiBaseUrl = options.apiBaseUrl ?? getActiveApiBase();
  const mobileSessionToken = options.skipAuth ? null : readMobileSessionToken(apiBaseUrl);
  const { apiBaseUrl: _apiBaseUrl, skipAuth: _skipAuth, ...fetchOptions } = options;

  const response = await fetch(buildApiUrl(url, apiBaseUrl), {
    ...fetchOptions,
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

export async function checkApiHealth(apiBaseUrl: string) {
  const normalizedApiBase = normalizeServerApiBase(apiBaseUrl);
  await apiRequest<{ ok: true }>('/api/health', {
    apiBaseUrl: normalizedApiBase,
    skipAuth: true,
  });
  return normalizedApiBase;
}
