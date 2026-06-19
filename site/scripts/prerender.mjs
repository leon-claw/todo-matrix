import {readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const distRoot = path.join(siteRoot, 'dist');
const ssrRoot = path.join(siteRoot, 'dist-ssr');

const templatePath = path.join(distRoot, 'index.html');
const serverEntryPath = path.join(ssrRoot, 'entry-server.js');

const template = await readFile(templatePath, 'utf8');
const {render} = await import(pathToFileURL(serverEntryPath).href);
const appHtml = render();

const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

await writeFile(templatePath, html, 'utf8');
await rm(ssrRoot, {recursive: true, force: true});
