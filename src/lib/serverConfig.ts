export type ServerMode = 'official' | 'custom';

export interface ServerConfig {
  apiBaseUrl: string;
  mode: ServerMode;
}

export const DEFAULT_OFFICIAL_API_BASE = 'https://todo-matrix.jianghong.site/api';
export const SERVER_CONFIG_STORAGE_KEY = 'todo-matrix:server-config';
export const SERVER_CONFIG_CHANGED_EVENT = 'todo-matrix:server-config-changed';

const LEGACY_MOBILE_SESSION_TOKEN_KEY = 'todo-matrix:mobile-session-token';
const LEGACY_CLIENT_SESSION_HINT_KEY = 'todo-matrix:client-session-present';

function readViteEnv() {
  return (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env;
}

export function normalizeServerApiBase(input: string) {
  const rawValue = input.trim();
  let url: URL;

  try {
    url = new URL(rawValue);
  } catch {
    throw new Error('请输入有效的服务器地址');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('服务器地址必须使用 http 或 https');
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const apiIndex = segments.findIndex((segment) => segment.toLowerCase() === 'api');
  const baseSegments = apiIndex >= 0 ? segments.slice(0, apiIndex + 1) : [...segments, 'api'];

  url.pathname = `/${baseSegments.join('/')}`;
  url.search = '';
  url.hash = '';

  return url.toString().replace(/\/$/, '');
}

export function normalizeServerConfig(config: ServerConfig): ServerConfig {
  if (config.mode === 'official') {
    return {
      apiBaseUrl: config.apiBaseUrl ? normalizeServerApiBase(config.apiBaseUrl) : '',
      mode: 'official',
    };
  }

  return {
    apiBaseUrl: normalizeServerApiBase(config.apiBaseUrl),
    mode: 'custom',
  };
}

export function readStoredServerConfig(serialized: string | null, officialApiBase = DEFAULT_OFFICIAL_API_BASE): ServerConfig {
  if (!serialized) {
    return normalizeServerConfig({ apiBaseUrl: officialApiBase, mode: 'official' });
  }

  try {
    const value = JSON.parse(serialized) as Partial<ServerConfig>;
    if (value.mode === 'custom' && typeof value.apiBaseUrl === 'string') {
      return normalizeServerConfig({ apiBaseUrl: value.apiBaseUrl, mode: 'custom' });
    }
  } catch {
    // Fall back to the official service when the local setting is unreadable.
  }

  return normalizeServerConfig({ apiBaseUrl: officialApiBase, mode: 'official' });
}

export function getRuntimeOfficialApiBase() {
  const viteEnv = readViteEnv();
  const configuredGlobalApiBase =
    typeof __TODO_MATRIX_API_BASE_URL__ === 'undefined' ? '' : __TODO_MATRIX_API_BASE_URL__;
  const viteApiBase = typeof viteEnv?.VITE_API_BASE_URL === 'string' ? viteEnv.VITE_API_BASE_URL : '';
  const fallbackApiBase =
    typeof __TODO_MATRIX_API_BASE_FALLBACK__ === 'undefined' ? '' : __TODO_MATRIX_API_BASE_FALLBACK__;
  const isProd = Boolean(viteEnv?.PROD);
  const apiBase = configuredGlobalApiBase || viteApiBase || (isProd ? fallbackApiBase || DEFAULT_OFFICIAL_API_BASE : '');

  return apiBase ? normalizeServerApiBase(apiBase) : '';
}

export function getActiveServerConfig(): ServerConfig {
  if (typeof window === 'undefined') {
    return readStoredServerConfig(null, getRuntimeOfficialApiBase());
  }

  return readStoredServerConfig(window.localStorage.getItem(SERVER_CONFIG_STORAGE_KEY), getRuntimeOfficialApiBase());
}

export function getActiveApiBase() {
  return getActiveServerConfig().apiBaseUrl;
}

export function serverConfigEquals(left: ServerConfig, right: ServerConfig) {
  return normalizeServerConfig(left).apiBaseUrl === normalizeServerConfig(right).apiBaseUrl;
}

export function saveServerConfig(config: ServerConfig) {
  const normalizedConfig = normalizeServerConfig(config);
  if (typeof window === 'undefined') {
    return normalizedConfig;
  }

  if (normalizedConfig.mode === 'official') {
    window.localStorage.removeItem(SERVER_CONFIG_STORAGE_KEY);
  } else {
    window.localStorage.setItem(SERVER_CONFIG_STORAGE_KEY, JSON.stringify(normalizedConfig));
  }

  window.dispatchEvent(new CustomEvent(SERVER_CONFIG_CHANGED_EVENT, { detail: normalizedConfig }));
  return normalizedConfig;
}

export function subscribeServerConfigChange(listener: (config: ServerConfig) => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleChange = () => listener(getActiveServerConfig());
  window.addEventListener(SERVER_CONFIG_CHANGED_EVENT, handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener(SERVER_CONFIG_CHANGED_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}

function createStorageSuffix(apiBaseUrl: string) {
  return encodeURIComponent(apiBaseUrl ? normalizeServerApiBase(apiBaseUrl) : 'same-origin');
}

export function createClientSessionStorageKeys(apiBaseUrl: string) {
  const suffix = createStorageSuffix(apiBaseUrl);

  return {
    hint: `todo-matrix:client-session-present:${suffix}`,
    legacyHint: LEGACY_CLIENT_SESSION_HINT_KEY,
    legacyToken: LEGACY_MOBILE_SESSION_TOKEN_KEY,
    token: `todo-matrix:mobile-session-token:${suffix}`,
  };
}
