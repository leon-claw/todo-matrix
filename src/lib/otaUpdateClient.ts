import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import type { BundleInfo, DownloadOptions } from '@capgo/capacitor-updater';
import {
  type OtaRuntimeInfo,
  type OtaUpdateManifest,
  resolveOtaUpdatePlan,
  shouldCheckForOtaUpdate,
} from './otaUpdatePolicy';

const OTA_LAST_CHECKED_AT_KEY = 'todo-matrix:ota-last-checked-at';
const OTA_QUEUED_VERSION_KEY = 'todo-matrix:ota-queued-version';

const configuredWebBundleVersion =
  typeof __TODO_MATRIX_WEB_BUNDLE_VERSION__ === 'undefined' ? '0.0.0' : __TODO_MATRIX_WEB_BUNDLE_VERSION__;
const configuredNativeVersion =
  typeof __TODO_MATRIX_NATIVE_VERSION__ === 'undefined' ? '0.0.0' : __TODO_MATRIX_NATIVE_VERSION__;
const configuredManifestUrl =
  typeof __TODO_MATRIX_OTA_MANIFEST_URL__ === 'undefined' ? '' : __TODO_MATRIX_OTA_MANIFEST_URL__;

export type SilentOtaUpdateResult =
  | { type: 'already-queued'; version: string }
  | { type: 'disabled' }
  | { type: 'native-required'; minNativeVersion: string; policy: 'force' | 'recommend' }
  | { type: 'none' }
  | { type: 'skipped-throttled' }
  | { type: 'web-silent'; version: string };

interface UpdaterAdapter {
  download(options: DownloadOptions): Promise<Pick<BundleInfo, 'id' | 'version'>>;
  next(options: { id: string }): Promise<unknown>;
  notifyAppReady(): Promise<unknown>;
}

interface SilentOtaUpdateDeps {
  fetchManifest: () => Promise<OtaUpdateManifest | null>;
  getLastCheckedAt: () => number | null;
  getQueuedVersion: () => string | null;
  getRuntimeInfo: () => Promise<OtaRuntimeInfo>;
  now: () => number;
  setLastCheckedAt: (timestamp: number) => void;
  setQueuedVersion: (version: string) => void;
  updater: UpdaterAdapter;
}

function isAndroidNativeRuntime() {
  return Capacitor.getPlatform() === 'android' && Capacitor.isNativePlatform();
}

function readNumberStorage(key: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(key);
  if (!value) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

async function fetchConfiguredManifest() {
  if (!configuredManifestUrl) {
    return null;
  }

  const response = await fetch(configuredManifestUrl, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`OTA manifest request failed: ${response.status}`);
  }

  return (await response.json()) as OtaUpdateManifest;
}

async function getCapacitorRuntimeInfo(): Promise<OtaRuntimeInfo> {
  const current = await CapacitorUpdater.current();
  const currentBundleVersion =
    current.bundle.id === 'builtin' ? configuredWebBundleVersion : current.bundle.version || configuredWebBundleVersion;

  return {
    nativeVersion: current.native || configuredNativeVersion,
    platform: isAndroidNativeRuntime() ? 'android' : 'web',
    webBundleVersion: currentBundleVersion,
  };
}

function createBrowserDeps(): SilentOtaUpdateDeps {
  return {
    fetchManifest: fetchConfiguredManifest,
    getLastCheckedAt: () => readNumberStorage(OTA_LAST_CHECKED_AT_KEY),
    getQueuedVersion: () =>
      typeof window === 'undefined' ? null : window.localStorage.getItem(OTA_QUEUED_VERSION_KEY),
    getRuntimeInfo: getCapacitorRuntimeInfo,
    now: () => Date.now(),
    setLastCheckedAt: (timestamp) => {
      window.localStorage.setItem(OTA_LAST_CHECKED_AT_KEY, String(timestamp));
    },
    setQueuedVersion: (version) => {
      window.localStorage.setItem(OTA_QUEUED_VERSION_KEY, version);
    },
    updater: CapacitorUpdater,
  };
}

export async function runSilentOtaUpdateCheck({
  deps = createBrowserDeps(),
  manual = false,
}: {
  deps?: SilentOtaUpdateDeps;
  manual?: boolean;
} = {}): Promise<SilentOtaUpdateResult> {
  await deps.updater.notifyAppReady();

  const now = deps.now();
  const lastCheckedAt = deps.getLastCheckedAt();
  if (!shouldCheckForOtaUpdate({ lastCheckedAt, manual, now })) {
    return { type: 'skipped-throttled' };
  }

  const manifest = await deps.fetchManifest();
  if (!manifest) {
    return { type: 'disabled' };
  }

  deps.setLastCheckedAt(now);
  const current = await deps.getRuntimeInfo();
  const plan = resolveOtaUpdatePlan({ current, manifest });

  if (plan.type === 'native-required') {
    return {
      minNativeVersion: plan.minNativeVersion,
      policy: plan.policy,
      type: 'native-required',
    };
  }

  if (plan.type !== 'web-silent') {
    return { type: 'none' };
  }

  if (deps.getQueuedVersion() === plan.bundleVersion) {
    return { type: 'already-queued', version: plan.bundleVersion };
  }

  const bundle = await deps.updater.download({
    checksum: manifest.sha256,
    url: plan.url,
    version: plan.bundleVersion,
  });

  await deps.updater.next({ id: bundle.id });
  deps.setQueuedVersion(plan.bundleVersion);

  return { type: 'web-silent', version: plan.bundleVersion };
}

export function startSilentOtaUpdateCheck() {
  if (!isAndroidNativeRuntime()) {
    return;
  }

  void runSilentOtaUpdateCheck().catch((error) => {
    console.info('Silent OTA update check skipped', error);
  });
}
