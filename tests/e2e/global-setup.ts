import { createServer, type Server } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import type { FullConfig } from '@playwright/test';

const port = 4173;
const host = '127.0.0.1';

export default async function globalSetup(_config: FullConfig) {
  const distRoot = resolve('dist');
  const indexPath = join(distRoot, 'index.html');

  if (!existsSync(indexPath)) {
    throw new Error('dist/index.html was not found. Run npm run build before Playwright tests.');
  }

  const server = await startStaticServer(distRoot);
  return async () => {
    await closeServer(server);
  };
}

function startStaticServer(distRoot: string): Promise<Server> {
  const contentTypes: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`);
      const relativePath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
      const filePath = join(distRoot, relativePath);
      const file = await readFile(filePath);
      response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream' });
      response.end(file);
    } catch {
      const file = await readFile(join(distRoot, 'index.html'));
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(file);
    }
  });

  return new Promise((resolveServer, rejectServer) => {
    server.once('error', rejectServer);
    server.listen(port, host, () => {
      server.off('error', rejectServer);
      resolveServer(server);
    });
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolveClose, rejectClose) => {
    server.close((error) => {
      if (error) rejectClose(error);
      else resolveClose();
    });
  });
}
