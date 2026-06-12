import { createReadStream } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = path.resolve(import.meta.dirname, '..', '..');

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const key = argument.slice(2);
    if (['create-draft', 'publish'].includes(key)) {
      values[key] = true;
      continue;
    }
    values[key] = argv[index + 1];
    index += 1;
  }
  return values;
}

function git(...args) {
  const result = spawnSync('git', args, { cwd: rootDir, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  }
  return result.stdout.trim();
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
}

function contentType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return {
    '.aab': 'application/octet-stream',
    '.apk': 'application/vnd.android.package-archive',
    '.dmg': 'application/x-apple-diskimage',
    '.exe': 'application/vnd.microsoft.portable-executable',
    '.ipa': 'application/octet-stream',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
  }[extension] || 'application/octet-stream';
}

async function githubRequest(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
  if (response.status === 204) {
    return null;
  }
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }
  return body ? JSON.parse(body) : null;
}

const args = parseArgs(process.argv.slice(2));
const tag = args.tag;
const repository = args.repo || process.env.GITHUB_REPOSITORY || 'leon-claw/todo-matrix';
const token = process.env.GITHUB_TOKEN;
const artifactDir = path.resolve(rootDir, args.dir || path.join('release-artifacts', tag || ''));

if (!tag) {
  throw new Error('Use --tag <tag>, for example --tag v1.2.0.');
}
if (!token) {
  throw new Error('GITHUB_TOKEN is required.');
}
if (!args['create-draft'] && !args.publish) {
  throw new Error('Choose --create-draft to create/upload, or --publish to upload and publish.');
}

const head = git('rev-parse', 'HEAD');
const tagCommit = git('rev-list', '-n', '1', tag);
if (head !== tagCommit) {
  throw new Error(`HEAD (${head}) is not the commit referenced by ${tag} (${tagCommit}).`);
}

const [owner, repo] = repository.split('/');
if (!owner || !repo) {
  throw new Error(`Invalid repository: ${repository}`);
}

const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
let release;
try {
  release = await githubRequest(`${apiBase}/releases/tags/${encodeURIComponent(tag)}`, token);
} catch (error) {
  if (!String(error.message).includes('GitHub API 404:')) {
    throw error;
  }
}

if (!release) {
  if (!args['create-draft']) {
    throw new Error(`Release ${tag} does not exist. Create it first with --create-draft.`);
  }
  let body = '';
  if (args['notes-file']) {
    body = await readFile(path.resolve(rootDir, args['notes-file']), 'utf8');
  }
  release = await githubRequest(`${apiBase}/releases`, token, {
    method: 'POST',
    body: JSON.stringify({
      body,
      draft: true,
      generate_release_notes: !body,
      name: `Todo Matrix ${tag}`,
      tag_name: tag,
      target_commitish: head,
    }),
  });
}

const files = await listFiles(artifactDir);
if (files.length === 0) {
  throw new Error(`No release artifacts found in ${artifactDir}`);
}

for (const filePath of files) {
  const fileName = path.basename(filePath);
  const existing = release.assets.find((asset) => asset.name === fileName);
  if (existing) {
    await githubRequest(`${apiBase}/releases/assets/${existing.id}`, token, { method: 'DELETE' });
  }

  const fileStats = await stat(filePath);
  const uploadUrl = release.upload_url.replace('{?name,label}', `?name=${encodeURIComponent(fileName)}`);
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Length': String(fileStats.size),
      'Content-Type': contentType(fileName),
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: createReadStream(filePath),
    duplex: 'half',
  });
  if (!response.ok) {
    throw new Error(`Failed to upload ${fileName}: ${response.status} ${await response.text()}`);
  }
  console.log(`Uploaded ${fileName}`);
}

if (args.publish) {
  release = await githubRequest(`${apiBase}/releases/${release.id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ draft: false }),
  });
  console.log(`Published ${release.html_url}`);
} else {
  console.log(`Draft release updated: ${release.html_url}`);
}
