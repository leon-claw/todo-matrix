import { useCallback, useEffect, useState } from 'react';
import {
  type ServerConfig,
  getActiveServerConfig,
  saveServerConfig,
  subscribeServerConfigChange,
} from '../lib/serverConfig';

export function useServerConfig() {
  const [serverConfig, setServerConfigState] = useState(() => getActiveServerConfig());

  useEffect(() => subscribeServerConfigChange(setServerConfigState), []);

  const setServerConfig = useCallback((nextConfig: ServerConfig) => {
    const normalizedConfig = saveServerConfig(nextConfig);
    setServerConfigState(normalizedConfig);
    return normalizedConfig;
  }, []);

  return {
    serverConfig,
    setServerConfig,
  };
}
