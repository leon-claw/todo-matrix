/// <reference types="vite/client" />

declare const __TODO_MATRIX_API_BASE_URL__: string;

interface Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    platform?: string;
  };
}
