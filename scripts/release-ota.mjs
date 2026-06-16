import { existsSync } from 'node:fs';
import { copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultBaseUrl = 'https://web.jianghong.site/app/todo-matrix/ota';
const defaultChannels = ['android', 'windows'];

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) {
      continue;
    }

    const [rawKey, inlineValue] = argument.slice(2).split('=');
    if (inlineValue !== undefined) {
      options[rawKey] = inlineValue;
      continue;
    }

    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith('--')) {
      options[rawKey] = true;
      continue;
    }

    options[rawKey] = nextValue;
    index += 1;
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

function splitChannels(value) {
  if (!value || value === true) {
    return defaultChannels;
  }

  const channels = String(value)
    .split(',')
    .map((channel) => channel.trim())
    .filter(Boolean);

  for (const channel of channels) {
    if (!defaultChannels.includes(channel)) {
      throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  return channels.length > 0 ? channels : defaultChannels;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || rootDir,
      env: { ...process.env, ...options.env },
      shell: false,
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

function npmScriptArgs(scriptName, scriptArgs) {
  if (process.platform === 'win32') {
    return {
      args: ['/d', '/s', '/c', 'npm.cmd', 'run', scriptName, '--', ...scriptArgs],
      command: process.env.ComSpec || 'cmd.exe',
    };
  }

  return {
    args: ['run', scriptName, '--', ...scriptArgs],
    command: 'npm',
  };
}

function quoteRemotePath(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function channelBaseUrl(channel, options) {
  const rawChannelUrl = options[`${channel}-base-url`];
  if (rawChannelUrl && rawChannelUrl !== true) {
    return String(rawChannelUrl).replace(/\/+$/, '');
  }

  const baseUrl = String(options['base-url'] || defaultBaseUrl).replace(/\/+$/, '');
  return `${baseUrl}/${channel}`;
}

function buildScriptArgs(channel, options) {
  const args = ['--version', options.version, '--base-url', channelBaseUrl(channel, options)];

  if (options['native-version'] && options['native-version'] !== true) {
    args.push('--native-version', options['native-version']);
  }

  if (options['min-native-version'] && options['min-native-version'] !== true) {
    args.push('--min-native-version', options['min-native-version']);
  }

  if (options['release-notes'] && options['release-notes'] !== true) {
    args.push('--release-notes', options['release-notes']);
  }

  return args;
}

function artifactPaths(channel, version) {
  const channelDir = path.join(rootDir, 'ota', channel);
  return {
    channelDir,
    manifestPath: path.join(channelDir, 'manifest.json'),
    versionDir: path.join(channelDir, version),
    zipPath: path.join(channelDir, version, 'dist.zip'),
  };
}

async function assertArtifacts(channel, version) {
  const paths = artifactPaths(channel, version);
  if (!existsSync(paths.manifestPath)) {
    throw new Error(`${channel} manifest was not generated: ${paths.manifestPath}`);
  }

  if (!existsSync(paths.zipPath)) {
    throw new Error(`${channel} bundle was not generated: ${paths.zipPath}`);
  }

  return paths;
}

async function publishToDirectory(channel, version, publishDir) {
  const paths = await assertArtifacts(channel, version);
  const targetChannelDir = path.resolve(rootDir, publishDir, channel);
  const targetVersionDir = path.join(targetChannelDir, version);

  await mkdir(targetVersionDir, { recursive: true });
  await copyFile(paths.manifestPath, path.join(targetChannelDir, 'manifest.json'));
  await copyFile(paths.zipPath, path.join(targetVersionDir, 'dist.zip'));

  console.log(`${channel} uploaded to local directory: ${targetChannelDir}`);
}

async function publishToSsh(channel, version, sshHost, sshPath) {
  const paths = await assertArtifacts(channel, version);
  const remoteChannelDir = `${sshPath.replace(/\/+$/, '')}/${channel}`;
  const remoteVersionDir = `${remoteChannelDir}/${version}`;

  await run('ssh', [sshHost, `mkdir -p ${quoteRemotePath(remoteVersionDir)}`]);
  await run('scp', [paths.manifestPath, `${sshHost}:${remoteChannelDir}/manifest.json`]);
  await run('scp', [paths.zipPath, `${sshHost}:${remoteVersionDir}/dist.zip`]);

  console.log(`${channel} uploaded to ssh target: ${sshHost}:${remoteChannelDir}`);
}

const args = parseArgs(process.argv.slice(2));
const version = args.version && args.version !== true ? String(args.version) : defaultVersion();
const channels = splitChannels(args.channels);
const dryRun = Boolean(args['dry-run']);
const publishDir = args['publish-dir'] && args['publish-dir'] !== true ? String(args['publish-dir']) : '';
const sshHost = args['ssh-host'] && args['ssh-host'] !== true ? String(args['ssh-host']) : '';
const sshPath = args['ssh-path'] && args['ssh-path'] !== true ? String(args['ssh-path']) : '';

if (!dryRun && !publishDir && (!sshHost || !sshPath)) {
  throw new Error('Publish target is required. Use --publish-dir <path>, or --ssh-host <user@host> --ssh-path <path>, or --dry-run.');
}

if (publishDir && (sshHost || sshPath)) {
  throw new Error('Use either --publish-dir or --ssh-host/--ssh-path, not both.');
}

if ((sshHost && !sshPath) || (!sshHost && sshPath)) {
  throw new Error('Both --ssh-host and --ssh-path are required for SSH publishing.');
}

console.log(`Release version: ${version}`);
console.log(`Channels: ${channels.join(', ')}`);

await rm(path.join(rootDir, 'ota'), { recursive: true, force: true });

for (const channel of channels) {
  const { command, args: scriptArgs } = npmScriptArgs(`build:${channel}:ota`, buildScriptArgs(channel, { ...args, version }));
  await run(command, scriptArgs);
  await assertArtifacts(channel, version);
}

if (dryRun) {
  console.log('Dry run finished. Artifacts were built but not uploaded.');
} else if (publishDir) {
  for (const channel of channels) {
    await publishToDirectory(channel, version, publishDir);
  }
} else {
  for (const channel of channels) {
    await publishToSsh(channel, version, sshHost, sshPath);
  }
}

console.log('Release finished.');
