export interface HeaderAccountStateInput {
  hasUser: boolean;
  isAuthLoading: boolean;
  isCloudMode: boolean;
  isSyncing: boolean;
}

export type HeaderAccountState =
  | {
      disabled: boolean;
      kind: 'login';
      label: '登录';
      loading: boolean;
    }
  | {
      disabled: true;
      kind: 'status';
      label: '云端模式' | '本地模式';
      loading: boolean;
    };

export function getHeaderAccountState({
  hasUser,
  isAuthLoading,
  isCloudMode,
  isSyncing,
}: HeaderAccountStateInput): HeaderAccountState {
  if (!hasUser) {
    return {
      disabled: isAuthLoading,
      kind: 'login',
      label: '登录',
      loading: isAuthLoading,
    };
  }

  return {
    disabled: true,
    kind: 'status',
    label: isCloudMode ? '云端模式' : '本地模式',
    loading: isCloudMode && isSyncing,
  };
}
