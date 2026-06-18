import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) {
      continue;
    }

    const [rawKey, inlineValue] = argument.slice(2).split('=');
    const value = inlineValue ?? argv[index + 1];
    if (inlineValue === undefined) {
      index += 1;
    }
    options[rawKey] = value;
  }
  return options;
}

function defaultVersion() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    `${pad(now.getHours())}${pad(now.getMinutes())}`,
  ].join('.');
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || rootDir,
      env: { ...process.env, ...options.env },
      shell: options.shell ?? false,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
  });
}

async function zipDist(distDir, zipPath) {
  await rm(zipPath, { force: true });

  if (process.platform === 'win32') {
    await run('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      `Compress-Archive -Path '${path.join(distDir, '*').replaceAll("'", "''")}' -DestinationPath '${zipPath.replaceAll("'", "''")}' -Force`,
    ]);
    return;
  }

  await run('zip', ['-r', zipPath, '.'], { cwd: distDir });
}

function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    createReadStream(filePath)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')));
  });
}

const args = parseArgs(process.argv.slice(2));
const version = args.version || defaultVersion();
const nativeVersion = args['native-version'] || packageJson.version;
const minNativeVersion = args['min-native-version'] || nativeVersion;
const outputDir = path.resolve(rootDir, args['output-dir'] || path.join('ota', 'android'));
const baseUrl = (args['base-url'] || 'https://todo-matrix.jianghong.site/ota/android').replace(/\/$/, '');
const manifestUrl = args['manifest-url'] || `${baseUrl}/manifest.json`;
const releaseNotes = args['release-notes'] || '静默更新 Web 资源';

const distDir = path.join(rootDir, 'dist');
const versionDir = path.join(outputDir, version);
const zipPath = path.join(versionDir, 'dist.zip');

const npmCommand = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npm';
const npmArgs =
  process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npm.cmd', 'run', 'build', '--', '--mode', 'android']
    : ['run', 'build', '--', '--mode', 'android'];

await run(npmCommand, npmArgs, {
  env: {
    TODO_MATRIX_NATIVE_VERSION: nativeVersion,
    TODO_MATRIX_OTA_MANIFEST_URL: manifestUrl,
    TODO_MATRIX_WEB_BUNDLE_VERSION: version,
  },
});

if (!existsSync(path.join(distDir, 'index.html'))) {
  throw new Error('dist/index.html was not generated');
}

await mkdir(versionDir, { recursive: true });
await zipDist(distDir, zipPath);

const checksum = await sha256(zipPath);
const manifest = {
  generatedAt: new Date().toISOString(),
  latestNativeVersion: nativeVersion,
  latestWebBundleVersion: version,
  minNativeVersion,
  nativePolicy: 'none',
  releaseNotes,
  sha256: checksum,
  webBundleUrl: `${baseUrl}/${version}/dist.zip`,
  webPolicy: 'silent',
};

await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`Android OTA bundle: ${zipPath}`);
console.log(`Android OTA manifest: ${path.join(outputDir, 'manifest.json')}`);
console.log(`Version: ${version}`);
console.log(`SHA-256: ${checksum}`);
