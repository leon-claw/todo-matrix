import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getHeaderAccountState } from '../src/lib/headerAccountState';

test('shows login action when there is no signed-in user', () => {
  assert.deepEqual(
    getHeaderAccountState({
      hasUser: false,
      isAuthLoading: false,
      isCloudMode: false,
      isSyncing: false,
    }),
    {
      disabled: false,
      kind: 'login',
      label: '登录',
      loading: false,
    },
  );
});

test('shows the active storage mode and real sync activity for signed-in users', () => {
  assert.deepEqual(
    getHeaderAccountState({
      hasUser: true,
      isAuthLoading: false,
      isCloudMode: true,
      isSyncing: true,
    }),
    {
      disabled: true,
      kind: 'status',
      label: '云端模式',
      loading: true,
    },
  );

  assert.deepEqual(
    getHeaderAccountState({
      hasUser: true,
      isAuthLoading: false,
      isCloudMode: false,
      isSyncing: false,
    }),
    {
      disabled: true,
      kind: 'status',
      label: '本地模式',
      loading: false,
    },
  );
});
