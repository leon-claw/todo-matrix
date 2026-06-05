/// <reference types="vite/client" />

declare const __TODO_MATRIX_API_BASE_URL__: string;
declare const __TODO_MATRIX_NATIVE_VERSION__: string;
declare const __TODO_MATRIX_OTA_MANIFEST_URL__: string;
declare const __TODO_MATRIX_WEB_BUNDLE_VERSION__: string;

interface Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    platform?: string;
  };
}
