/// <reference types="vite/client" />

interface Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    platform?: string;
  };
}
