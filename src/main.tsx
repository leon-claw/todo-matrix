import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './i18n/i18n';
import { App } from './App';
import { startSilentOtaUpdateCheck } from './lib/otaUpdateClient';
import { appTheme } from './theme';
import './styles.css';

startSilentOtaUpdateCheck();
void window.todoMatrixDesktop?.notifyOtaReady();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

if (
  'serviceWorker' in navigator &&
  import.meta.env.PROD &&
  !window.todoMatrixDesktop?.isDesktop &&
  !window.Capacitor?.isNativePlatform?.()
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
      console.error('Service worker registration failed', error);
    });
  });
}
