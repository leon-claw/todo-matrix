import { mkdir, readdir, readFile, rm, stat, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_API_BASE_URL = 'https://web.jianghong.site/app/todo-matrix/api';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(rootDir, 'wechat-miniprogram');
const distDir = path.join(sourceDir, 'dist');
const apiBaseUrl = (process.env.WECHAT_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

let esbuild = null;
try {
  esbuild = await import('esbuild');
} catch {
  esbuild = null;
}

function assertSafeDistPath() {
  const sourceWithSep = `${sourceDir}${path.sep}`;
  const distWithSep = `${distDir}${path.sep}`;
  if (!distWithSep.startsWith(sourceWithSep) || path.basename(distDir) !== 'dist') {
    throw new Error(`Refusing to clean unsafe dist path: ${distDir}`);
  }
}

function shouldSkip(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  return (
    normalized === 'dist' ||
    normalized.startsWith('dist/') ||
    normalized === 'project.private.config.json' ||
    normalized.endsWith('.map') ||
    normalized.endsWith('.log')
  );
}

function minifyJson(content) {
  return `${JSON.stringify(JSON.parse(content))}\n`;
}

function minifyWxml(content) {
  return `${content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()}\n`;
}

function minifyWxss(content) {
  return `${content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim()}\n`;
}

async function minifyJs(content, filePath) {
  if (!esbuild) {
    return content;
  }

  const result = await esbuild.transform(content, {
    charset: 'utf8',
    loader: 'js',
    minify: true,
    target: 'es2018',
    legalComments: 'none',
    sourcefile: filePath,
  });
  return result.code.endsWith('\n') ? result.code : `${result.code}\n`;
}

async function transformFile(sourcePath, destPath, relativePath) {
  if (relativePath === 'config.js') {
    await writeFile(
      destPath,
      `module.exports={API_BASE_URL:${JSON.stringify(apiBaseUrl)}};\n`,
      'utf8',
    );
    return;
  }

  const ext = path.extname(sourcePath).toLowerCase();
  if (!['.js', '.json', '.wxml', '.wxss'].includes(ext)) {
    await copyFile(sourcePath, destPath);
    return;
  }

  const content = await readFile(sourcePath, 'utf8');
  let output = content;
  if (ext === '.js') {
    output = await minifyJs(content, sourcePath);
  } else if (ext === '.json') {
    output = minifyJson(content);
  } else if (ext === '.wxml') {
    output = minifyWxml(content);
  } else if (ext === '.wxss') {
    output = minifyWxss(content);
  }

  await writeFile(destPath, output, 'utf8');
}

async function copyDirectory(currentSource, currentDest, relativeBase = '') {
  await mkdir(currentDest, { recursive: true });
  const entries = await readdir(currentSource);

  for (const entry of entries) {
    const sourcePath = path.join(currentSource, entry);
    const relativePath = path.join(relativeBase, entry);
    if (shouldSkip(relativePath)) {
      continue;
    }

    const destPath = path.join(currentDest, entry);
    const info = await stat(sourcePath);
    if (info.isDirectory()) {
      await copyDirectory(sourcePath, destPath, relativePath);
    } else if (info.isFile()) {
      await mkdir(path.dirname(destPath), { recursive: true });
      await transformFile(sourcePath, destPath, relativePath);
    }
  }
}

assertSafeDistPath();
await rm(distDir, { force: true, recursive: true });
await copyDirectory(sourceDir, distDir);

console.log(`微信小程序生产包已生成: ${distDir}`);
console.log(`API_BASE_URL=${apiBaseUrl}`);
