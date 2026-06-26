import {StrictMode} from 'react';
import {renderToString} from 'react-dom/server';
import App from './App.tsx';
import './i18n/i18n';

export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
