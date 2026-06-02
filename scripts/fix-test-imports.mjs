import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.argv[2] ?? 'tmp/test-build';

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await files(path));
    else if (entry.isFile() && path.endsWith('.js')) found.push(path);
  }
  return found;
}

function addJsExtension(source) {
  return source.replace(
    /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, prefix, specifier, suffix) => {
      if (specifier.endsWith('.js') || specifier.endsWith('.json') || specifier.endsWith('.css')) return match;
      return `${prefix}${specifier}.js${suffix}`;
    },
  );
}

for (const file of await files(root)) {
  const source = await readFile(file, 'utf8');
  const fixed = addJsExtension(source);
  if (fixed !== source) await writeFile(file, fixed);
}
