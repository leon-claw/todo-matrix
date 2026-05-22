import { contextBridge, ipcRenderer } from 'electron';

interface DesktopApiRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

contextBridge.exposeInMainWorld('todoMatrixDesktop', {
  apiRequest: (request: DesktopApiRequest) => ipcRenderer.invoke('todo-matrix:api-request', request),
  isDesktop: true,
});
