import { contextBridge, ipcRenderer } from 'electron';

interface DesktopApiRequest {
  apiBaseUrl?: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

contextBridge.exposeInMainWorld('todoMatrixDesktop', {
  apiRequest: (request: DesktopApiRequest) => ipcRenderer.invoke('todo-matrix:api-request', request),
  isDesktop: true,
  notifyOtaReady: () => ipcRenderer.invoke('todo-matrix:desktop-ota-ready'),
});
