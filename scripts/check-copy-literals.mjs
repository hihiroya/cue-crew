import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, 'src');
const contentRoot = path.join(sourceRoot, 'content');
const japanesePattern = /[ぁ-んァ-ン一-龥ー]/;

const legacyCopyFiles = new Set();

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) files.push(absolutePath);
  }
  return files;
}

function toRepoPath(absolutePath) {
  return path.relative(repoRoot, absolutePath).replaceAll(path.sep, '/');
}

const violations = [];
for (const file of await collectFiles(sourceRoot)) {
  if (file.startsWith(contentRoot)) continue;
  const repoPath = toRepoPath(file);
  if (legacyCopyFiles.has(repoPath)) continue;
  const text = await readFile(file, 'utf8');
  text.split(/\r?\n/).forEach((line, index) => {
    if (japanesePattern.test(line)) {
      violations.push(`${repoPath}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (violations.length) {
  console.error('Japanese copy literals must live in src/content/ja or an explicit legacy allowlist.');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Copy literal check passed.');
