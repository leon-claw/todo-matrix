import { useCallback, useEffect, useState } from 'react';
import {
  apiRequest,
  clearMobileSessionToken,
  hasClientSessionHint,
  markClientSessionPresent,
  saveMobileSessionToken,
} from '../lib/apiClient';
import type { CurrentUser } from '../types/auth';

interface AuthPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends AuthPayload {
  captchaAnswer: string;
  captchaId: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  nextPassword: string;
}

interface AuthResponse {
  token?: string;
  user: CurrentUser;
}

export function useAuth() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [hasStoredCloudSession, setHasStoredCloudSession] = useState(() => hasClientSessionHint());
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    setIsAuthLoading(true);
    try {
      const response = await apiRequest<{ user: CurrentUser | null }>('/api/auth/me');
      setUser(response.user);
      if (!response.user) {
        clearMobileSessionToken();
      }
      if (response.user) {
        markClientSessionPresent();
      }
      setHasStoredCloudSession(Boolean(response.user));
      setAuthError(null);
    } catch {
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (payload: AuthPayload) => {
    const response = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: payload,
    });
    saveMobileSessionToken(response.token);
    setHasStoredCloudSession(true);
    setUser(response.user);
    setAuthError(null);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: payload,
    });
    saveMobileSessionToken(response.token);
    setHasStoredCloudSession(true);
    setUser(response.user);
    setAuthError(null);
  }, []);

  const logout = useCallback(async () => {
    await apiRequest<void>('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    clearMobileSessionToken();
    setHasStoredCloudSession(false);
    setUser(null);
  }, []);

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    await apiRequest<void>('/api/auth/change-password', {
      method: 'POST',
      body: payload,
    });
    setAuthError(null);
  }, []);

  return {
    authError,
    changePassword,
    hasStoredCloudSession,
    isAuthLoading,
    login,
    logout,
    refreshUser,
    register,
    setAuthError,
    user,
  };
}
