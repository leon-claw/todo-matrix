/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

import { app, BrowserWindow, ipcMain, net, protocol, safeStorage, shell, session } from 'electron';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { markDesktopOtaReady, prepareDesktopRenderer, runDesktopOtaUpdateCheck } from './desktopOta';

const DEVELOPMENT_API_BASE = 'http://127.0.0.1:3001';
const PRODUCTION_API_BASE = 'https://web.jianghong.site/app/todo-matrix';
const DEFAULT_API_BASE = MAIN_WINDOW_VITE_DEV_SERVER_URL ? DEVELOPMENT_API_BASE : PRODUCTION_API_BASE;
const DESKTOP_API_BASE = (process.env.TODO_MATRIX_DESKTOP_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, '');
const DEFAULT_DESKTOP_OTA_MANIFEST_URL = `${PRODUCTION_API_BASE}/ota/windows/manifest.json`;
const DESKTOP_OTA_MANIFEST_URL = (
  process.env.TODO_MATRIX_DESKTOP_OTA_MANIFEST_URL || DEFAULT_DESKTOP_OTA_MANIFEST_URL
).trim();
const DESKTOP_RENDERER_SCHEME = 'todo-matrix';
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

protocol.registerSchemesAsPrivileged([
  {
    scheme: DESKTOP_RENDERER_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

interface DesktopApiRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface StoredSession {
  encryptedToken: string;
  savedAt: string;
}

let mainWindow: BrowserWindow | null = null;
let sessionToken: string | null = null;
let desktopRendererRoot: string | null = null;

function getSessionFilePath() {
  return path.join(app.getPath('userData'), 'desktop-session.json');
}

async function loadSessionToken() {
  if (!safeStorage.isEncryptionAvailable()) {
    return;
  }

  try {
    const stored = JSON.parse(await readFile(getSessionFilePath(), 'utf8')) as StoredSession;
    sessionToken = safeStorage.decryptString(Buffer.from(stored.encryptedToken, 'base64'));
  } catch {
    sessionToken = null;
  }
}

async function saveSessionToken(token: string) {
  sessionToken = token;

  if (!safeStorage.isEncryptionAvailable()) {
    return;
  }

  const encryptedToken = safeStorage.encryptString(token).toString('base64');
  const sessionFilePath = getSessionFilePath();
  await mkdir(path.dirname(sessionFilePath), { recursive: true });
  await writeFile(
    sessionFilePath,
    JSON.stringify({ encryptedToken, savedAt: new Date().toISOString() } satisfies StoredSession),
    'utf8',
  );
}

async function clearSessionToken() {
  sessionToken = null;
  await unlink(getSessionFilePath()).catch(() => undefined);
}

function readApiPath(input: string) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('Invalid API request URL');
  }

  let apiPath: string;

  if (/^https?:\/\//i.test(input)) {
    const apiBaseUrl = new URL(DESKTOP_API_BASE);
    const requestUrl = new URL(input);
    if (requestUrl.origin !== apiBaseUrl.origin || !requestUrl.pathname.startsWith(apiBaseUrl.pathname)) {
      throw new Error('External API origins are not allowed');
    }

    apiPath = requestUrl.pathname.slice(apiBaseUrl.pathname.length) + requestUrl.search;
  } else {
    apiPath = input.startsWith('/') ? input : `/${input}`;
  }

  if (apiPath !== '/api' && !apiPath.startsWith('/api/')) {
    throw new Error('Only /api requests are allowed');
  }

  return apiPath;
}

function readHeader(headers: Record<string, string> | undefined, name: string) {
  const targetName = name.toLowerCase();
  return Object.entries(headers || {}).find(([key]) => key.toLowerCase() === targetName)?.[1];
}

function sanitizePayload(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const { token: _token, expiresAt: _expiresAt, ...safePayload } = payload as Record<string, unknown>;
  return safePayload;
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return JSON.parse(text) as unknown;
  }

  return text;
}

async function handleApiRequest(_event: Electron.IpcMainInvokeEvent, request: DesktopApiRequest) {
  if (!request || typeof request !== 'object') {
    throw new Error('Invalid API request');
  }

  const method = (request.method || 'GET').toUpperCase();
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error(`HTTP method is not allowed: ${method}`);
  }

  const apiPath = readApiPath(request.url);
  const requestUrl = `${DESKTOP_API_BASE}${apiPath}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  let body: string | undefined;
  if (request.body !== undefined) {
    headers['Content-Type'] = readHeader(request.headers, 'Content-Type') || 'application/json';
    body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
  }

  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }

  let response: Response;
  try {
    response = await fetch(requestUrl, { body, headers, method });
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error instanceof Error ? error.message : 'Network request failed',
    };
  } finally {
    if (method === 'POST' && apiPath === '/api/auth/logout') {
      await clearSessionToken();
    }
  }

  const payload = await parseResponse(response);
  if (
    response.ok &&
    method === 'POST' &&
    (apiPath === '/api/auth/login' || apiPath === '/api/auth/register') &&
    payload &&
    typeof payload === 'object' &&
    typeof (payload as { token?: unknown }).token === 'string'
  ) {
    await saveSessionToken((payload as { token: string }).token);
  }

  return {
    ok: response.ok,
    payload: sanitizePayload(payload),
    status: response.status,
    statusText: response.statusText,
  };
}

function shouldUseDesktopOta() {
  return process.platform === 'win32' && !MAIN_WINDOW_VITE_DEV_SERVER_URL && DESKTOP_OTA_MANIFEST_URL !== '';
}

function getBuiltinRendererIndexPath() {
  return path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
}

function isPathInsideDirectory(rootPath: string, candidatePath: string) {
  const relativePath = path.relative(rootPath, candidatePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function registerDesktopRendererProtocol() {
  protocol.handle(DESKTOP_RENDERER_SCHEME, (request) => {
    const rendererRoot = desktopRendererRoot ?? path.dirname(getBuiltinRendererIndexPath());
    const requestUrl = new URL(request.url);
    const requestPath = decodeURIComponent(requestUrl.pathname || '/index.html');
    const relativeRequestPath = requestPath.replace(/^\/+/, '') || 'index.html';
    const filePath = path.resolve(rendererRoot, relativeRequestPath);

    if (!isPathInsideDirectory(rendererRoot, filePath)) {
      return new Response('Forbidden', { status: 403 });
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

async function getRendererIndexPath() {
  const builtinRendererIndex = getBuiltinRendererIndexPath();
  if (!shouldUseDesktopOta()) {
    return builtinRendererIndex;
  }

  return (
    await prepareDesktopRenderer({
      builtinRendererIndex,
      userDataPath: app.getPath('userData'),
    })
  ).indexPath;
}

function startDesktopOtaUpdateCheck() {
  if (!shouldUseDesktopOta()) {
    return;
  }

  void runDesktopOtaUpdateCheck({
    manifestUrl: DESKTOP_OTA_MANIFEST_URL,
    nativeVersion: app.getVersion(),
    userDataPath: app.getPath('userData'),
    webBundleVersion: app.getVersion(),
  }).catch((error) => {
    console.info('Desktop OTA update check skipped', error);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    height: 860,
    icon: path.join(app.getAppPath(), 'assets', 'branding', 'todo-matrix-icon-1024.png'),
    minHeight: 680,
    minWidth: 980,
    show: false,
    title: 'Todo Matrix',
    width: 1280,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      void shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (/^https?:\/\//i.test(url) && url !== MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const rendererIndexPath = await getRendererIndexPath();
    desktopRendererRoot = path.dirname(rendererIndexPath);
    void mainWindow.loadURL(`${DESKTOP_RENDERER_SCHEME}://renderer/index.html`);
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false);
    });
    registerDesktopRendererProtocol();

    await loadSessionToken();
    ipcMain.handle('todo-matrix:api-request', handleApiRequest);
    ipcMain.handle('todo-matrix:desktop-ota-ready', async () => {
      if (shouldUseDesktopOta()) {
        await markDesktopOtaReady(app.getPath('userData'));
      }
    });
    await createWindow();
    startDesktopOtaUpdateCheck();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createWindow();
        startDesktopOtaUpdateCheck();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
