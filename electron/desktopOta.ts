import AdmZip from 'adm-zip';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  type NativeUpdatePolicy,
  type OtaUpdateManifest,
  resolveOtaUpdatePlan,
  shouldCheckForOtaUpdate,
} from '../src/lib/otaUpdatePolicy';

export interface DesktopOtaState {
  activeVersion?: string;
  activeVersionStartedAt?: number;
  lastCheckedAt?: number;
  lastReadyVersion?: string;
  pendingVersion?: string;
}

export type DesktopOtaCheckResult =
  | { type: 'already-queued'; version: string }
  | { type: 'disabled' }
  | { type: 'native-required'; minNativeVersion: string; policy: Exclude<NativeUpdatePolicy, 'none'> }
  | { type: 'none' }
  | { type: 'skipped-throttled' }
  | { type: 'web-silent'; version: string };

export interface PreparedDesktopRenderer {
  indexPath: string;
  version: string;
}

interface DesktopOtaPaths {
  bundlesDir: string;
  downloadsDir: string;
  rootDir: string;
  stateFile: string;
}

function getDesktopOtaPaths(userDataPath: string): DesktopOtaPaths {
  const rootDir = path.join(userDataPath, 'desktop-ota');
  return {
    bundlesDir: path.join(rootDir, 'bundles'),
    downloadsDir: path.join(rootDir, 'downloads'),
    rootDir,
    stateFile: path.join(rootDir, 'state.json'),
  };
}

function assertSafeVersion(version: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(version)) {
    throw new Error(`Invalid desktop OTA version: ${version}`);
  }
}

function getBundleIndexPath(userDataPath: string, version: string) {
  assertSafeVersion(version);
  return path.join(getDesktopOtaPaths(userDataPath).bundlesDir, version, 'index.html');
}

async function pathExists(filePath: string) {
  return access(filePath)
    .then(() => true)
    .catch(() => false);
}

export async function readDesktopOtaState(userDataPath: string): Promise<DesktopOtaState> {
  try {
    return JSON.parse(await readFile(getDesktopOtaPaths(userDataPath).stateFile, 'utf8')) as DesktopOtaState;
  } catch {
    return {};
  }
}

async function writeDesktopOtaState(userDataPath: string, state: DesktopOtaState) {
  const paths = getDesktopOtaPaths(userDataPath);
  await mkdir(paths.rootDir, { recursive: true });
  await writeFile(paths.stateFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

async function sha256(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash('sha256');
    createReadStream(filePath)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')));
  });
}

async function extractZipSafely(zipPath: string, targetDir: string) {
  const zip = new AdmZip(zipPath);
  const targetRoot = path.resolve(targetDir);

  await rm(targetDir, { force: true, recursive: true });
  await mkdir(targetDir, { recursive: true });

  for (const entry of zip.getEntries()) {
    const normalizedName = entry.entryName.replace(/\\/g, '/');
    if (normalizedName.startsWith('/') || normalizedName.includes('../')) {
      throw new Error(`Unsafe zip entry: ${entry.entryName}`);
    }

    const destination = path.resolve(targetRoot, normalizedName);
    if (destination !== targetRoot && !destination.startsWith(`${targetRoot}${path.sep}`)) {
      throw new Error(`Unsafe zip destination: ${entry.entryName}`);
    }

    if (entry.isDirectory) {
      await mkdir(destination, { recursive: true });
      continue;
    }

    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, entry.getData());
  }
}

export async function installDesktopBundleFromZip({
  expectedSha256,
  userDataPath,
  version,
  zipPath,
}: {
  expectedSha256?: string;
  userDataPath: string;
  version: string;
  zipPath: string;
}) {
  assertSafeVersion(version);

  if (expectedSha256) {
    const actualSha256 = await sha256(zipPath);
    if (actualSha256.toLowerCase() !== expectedSha256.toLowerCase()) {
      throw new Error(`Desktop OTA checksum mismatch for ${version}`);
    }
  }

  const paths = getDesktopOtaPaths(userDataPath);
  const targetDir = path.join(paths.bundlesDir, version);
  const tempDir = path.join(paths.bundlesDir, `.tmp-${version}-${Date.now()}`);

  await extractZipSafely(zipPath, tempDir);
  if (!(await pathExists(path.join(tempDir, 'index.html')))) {
    throw new Error(`Desktop OTA bundle ${version} does not contain index.html`);
  }

  await rm(targetDir, { force: true, recursive: true });
  await mkdir(paths.bundlesDir, { recursive: true });
  await rename(tempDir, targetDir);

  const state = await readDesktopOtaState(userDataPath);
  await writeDesktopOtaState(userDataPath, {
    ...state,
    pendingVersion: version,
  });
}

export async function prepareDesktopRenderer({
  builtinRendererIndex,
  now = () => Date.now(),
  userDataPath,
}: {
  builtinRendererIndex: string;
  now?: () => number;
  userDataPath: string;
}): Promise<PreparedDesktopRenderer> {
  const state = await readDesktopOtaState(userDataPath);

  if (
    state.activeVersion &&
    state.activeVersionStartedAt &&
    state.lastReadyVersion !== state.activeVersion
  ) {
    state.activeVersion =
      state.lastReadyVersion && (await pathExists(getBundleIndexPath(userDataPath, state.lastReadyVersion)))
        ? state.lastReadyVersion
        : undefined;
    state.activeVersionStartedAt = undefined;
  }

  if (state.pendingVersion) {
    if (await pathExists(getBundleIndexPath(userDataPath, state.pendingVersion))) {
      state.activeVersion = state.pendingVersion;
      state.activeVersionStartedAt = now();
    }
    state.pendingVersion = undefined;
  }

  let indexPath = builtinRendererIndex;
  let version = 'builtin';

  if (state.activeVersion) {
    const activeIndexPath = getBundleIndexPath(userDataPath, state.activeVersion);
    if (await pathExists(activeIndexPath)) {
      indexPath = activeIndexPath;
      version = state.activeVersion;
    } else {
      state.activeVersion = undefined;
      state.activeVersionStartedAt = undefined;
    }
  }

  await writeDesktopOtaState(userDataPath, state);
  return { indexPath, version };
}

export async function markDesktopOtaReady(userDataPath: string) {
  const state = await readDesktopOtaState(userDataPath);
  if (!state.activeVersion) {
    return;
  }

  await writeDesktopOtaState(userDataPath, {
    ...state,
    activeVersionStartedAt: undefined,
    lastReadyVersion: state.activeVersion,
  });
}

async function downloadBundle({
  fetchImpl,
  url,
  version,
  userDataPath,
}: {
  fetchImpl: typeof fetch;
  url: string;
  userDataPath: string;
  version: string;
}) {
  assertSafeVersion(version);

  const paths = getDesktopOtaPaths(userDataPath);
  await mkdir(paths.downloadsDir, { recursive: true });

  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Desktop OTA bundle request failed: ${response.status}`);
  }

  const zipPath = path.join(paths.downloadsDir, `${version}.zip`);
  await writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
  return zipPath;
}

export async function runDesktopOtaUpdateCheck({
  fetchImpl = fetch,
  manifestUrl,
  nativeVersion,
  now = () => Date.now(),
  userDataPath,
  webBundleVersion,
}: {
  fetchImpl?: typeof fetch;
  manifestUrl: string;
  nativeVersion: string;
  now?: () => number;
  userDataPath: string;
  webBundleVersion: string;
}): Promise<DesktopOtaCheckResult> {
  if (!manifestUrl) {
    return { type: 'disabled' };
  }

  const state = await readDesktopOtaState(userDataPath);
  const checkedAt = now();
  if (!shouldCheckForOtaUpdate({ lastCheckedAt: state.lastCheckedAt, now: checkedAt })) {
    return { type: 'skipped-throttled' };
  }

  const manifestResponse = await fetchImpl(manifestUrl, { cache: 'no-cache' });
  if (!manifestResponse.ok) {
    throw new Error(`Desktop OTA manifest request failed: ${manifestResponse.status}`);
  }

  const manifest = (await manifestResponse.json()) as OtaUpdateManifest;
  const plan = resolveOtaUpdatePlan({
    current: {
      nativeVersion,
      platform: 'electron',
      webBundleVersion: state.activeVersion || webBundleVersion,
    },
    manifest,
  });

  await writeDesktopOtaState(userDataPath, { ...state, lastCheckedAt: checkedAt });

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

  if (state.pendingVersion === plan.bundleVersion) {
    return { type: 'already-queued', version: plan.bundleVersion };
  }

  const zipPath = await downloadBundle({
    fetchImpl,
    url: plan.url,
    userDataPath,
    version: plan.bundleVersion,
  });

  await installDesktopBundleFromZip({
    expectedSha256: manifest.sha256,
    userDataPath,
    version: plan.bundleVersion,
    zipPath,
  });

  return { type: 'web-silent', version: plan.bundleVersion };
}
