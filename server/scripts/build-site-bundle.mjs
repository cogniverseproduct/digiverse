/**
 * Builds the standalone site bundle used for per-client Vercel deployments.
 *
 *   input : client/dist   (output of `npm run build --prefix client`, which includes site.html)
 *   output: server/dist/site-bundle/
 *             site.html        template for a client's index.html (the exporter embeds the site data)
 *             manifest.json    { files: [{ path, sha1, size }] } of every static asset
 *             files/...        the static assets (JS, CSS, fonts, template images and data)
 *
 * The DigiVerse admin app's own index.html is NOT part of the bundle: a client
 * site never ships the admin application shell.
 *
 * Run after the client build:  node server/scripts/build-site-bundle.mjs
 * Fails loudly (non-zero exit) if anything cannot be shipped safely, so a broken
 * bundle can never reach production silently.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const clientDist = path.join(root, 'client', 'dist');
const outDir = path.join(root, 'server', 'dist', 'site-bundle');

// Must stay identical to isSafeBundlePath() in server/src/services/publishing/siteExporter.ts.
const SAFE_PATH = /^[A-Za-z0-9][A-Za-z0-9._@~+\-/]*$/;
const isSafe = (p) =>
  p.length > 0 && p.length <= 200 && SAFE_PATH.test(p) && !p.split('/').some((part) => part === '..' || part === '.' || part === '' || part.startsWith('.'));

const EXCLUDE = new Set(['index.html', 'site.html']);
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 3000;

async function walk(dir, base = '') {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await walk(path.join(dir, entry.name), rel)));
    else if (entry.isFile()) out.push(rel);
  }
  return out;
}

function fail(message) {
  console.error(`[site-bundle] ${message}`);
  process.exit(1);
}

try {
  await fs.access(path.join(clientDist, 'site.html'));
} catch {
  fail('client/dist/site.html is missing. Build the client first (npm run build --prefix client); the client build must include the site entry.');
}

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(path.join(outDir, 'files'), { recursive: true });

const manifest = [];
const unsafe = [];
let totalBytes = 0;

for (const rel of (await walk(clientDist)).sort()) {
  if (EXCLUDE.has(rel) || rel.endsWith('.map')) continue;
  if (!isSafe(rel)) { unsafe.push(rel); continue; }
  const data = await fs.readFile(path.join(clientDist, rel));
  if (data.length > MAX_FILE_BYTES) fail(`${rel} is larger than ${MAX_FILE_BYTES} bytes.`);
  totalBytes += data.length;
  const target = path.join(outDir, 'files', rel);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
  manifest.push({ path: rel, sha1: createHash('sha1').update(data).digest('hex'), size: data.length });
}

if (unsafe.length) {
  fail(`These files have names that cannot be deployed safely (use only letters, digits and . _ - / @ ~ +):\n  ${unsafe.slice(0, 20).join('\n  ')}`);
}
if (manifest.length === 0 || manifest.length > MAX_FILES) fail(`Unexpected file count: ${manifest.length}.`);

await fs.copyFile(path.join(clientDist, 'site.html'), path.join(outDir, 'site.html'));
await fs.writeFile(
  path.join(outDir, 'manifest.json'),
  JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), files: manifest }, null, 2)
);

console.log(`[site-bundle] ${manifest.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MB -> ${path.relative(root, outDir)}`);
