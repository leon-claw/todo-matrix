export {};

interface DesktopApiRequest {
  apiBaseUrl?: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface DesktopApiResponse<T = unknown> {
  ok: boolean;
  payload?: T;
  status: number;
  statusText?: string;
}

declare global {
  interface Window {
    todoMatrixDesktop?: {
      apiRequest<T = unknown>(request: DesktopApiRequest): Promise<DesktopApiResponse<T>>;
      isDesktop: true;
      notifyOtaReady(): Promise<void>;
    };
  }
}
