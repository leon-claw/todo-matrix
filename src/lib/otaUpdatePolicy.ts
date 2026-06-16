export const OTA_CHECK_THROTTLE_MS = 6 * 60 * 60 * 1000;

export type OtaRuntimePlatform = 'android' | 'electron' | 'web' | 'ios';
export type WebUpdatePolicy = 'silent' | 'prompt' | 'force';
export type NativeUpdatePolicy = 'none' | 'recommend' | 'force';

export interface OtaUpdateManifest {
  latestNativeVersion?: string;
  latestWebBundleVersion?: string;
  minNativeVersion?: string;
  minWebBundleVersion?: string;
  nativePolicy?: NativeUpdatePolicy;
  releaseNotes?: string;
  sha256?: string;
  signature?: string;
  webBundleUrl?: string;
  webPolicy?: WebUpdatePolicy;
}

export interface OtaRuntimeInfo {
  nativeVersion: string;
  platform: OtaRuntimePlatform;
  webBundleVersion: string;
}

export type OtaUpdatePlan =
  | { type: 'none' }
  | { bundleVersion: string; type: 'web-silent'; url: string }
  | { minNativeVersion: string; policy: Exclude<NativeUpdatePolicy, 'none'>; type: 'native-required' };

export function compareVersion(left: string | undefined, right: string | undefined) {
  if (!left && !right) {
    return 0;
  }
  if (!left) {
    return -1;
  }
  if (!right) {
    return 1;
  }

  const leftParts = left.split(/[.-]/).map((part) => Number.parseInt(part, 10));
  const rightParts = right.split(/[.-]/).map((part) => Number.parseInt(part, 10));
  const partCount = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < partCount; index += 1) {
    const leftPart = Number.isFinite(leftParts[index]) ? leftParts[index] : 0;
    const rightPart = Number.isFinite(rightParts[index]) ? rightParts[index] : 0;

    if (leftPart > rightPart) {
      return 1;
    }
    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
}

export function shouldCheckForOtaUpdate({
  lastCheckedAt,
  manual = false,
  now,
}: {
  lastCheckedAt?: number | null;
  manual?: boolean;
  now: number;
}) {
  if (manual || !lastCheckedAt) {
    return true;
  }

  return now - lastCheckedAt >= OTA_CHECK_THROTTLE_MS;
}

export function resolveOtaUpdatePlan({
  current,
  manifest,
}: {
  current: OtaRuntimeInfo;
  manifest: OtaUpdateManifest;
}): OtaUpdatePlan {
  if (current.platform !== 'android' && current.platform !== 'electron') {
    return { type: 'none' };
  }

  if (manifest.minNativeVersion && compareVersion(current.nativeVersion, manifest.minNativeVersion) < 0) {
    return {
      minNativeVersion: manifest.minNativeVersion,
      policy: manifest.nativePolicy === 'recommend' ? 'recommend' : 'force',
      type: 'native-required',
    };
  }

  if (
    manifest.webPolicy === 'silent' &&
    manifest.latestWebBundleVersion &&
    manifest.webBundleUrl &&
    compareVersion(current.webBundleVersion, manifest.latestWebBundleVersion) < 0
  ) {
    return {
      bundleVersion: manifest.latestWebBundleVersion,
      type: 'web-silent',
      url: manifest.webBundleUrl,
    };
  }

  return { type: 'none' };
}
