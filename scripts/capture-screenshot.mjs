import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  }),
);

let url = args.get('url');
const out = resolve(args.get('out') ?? 'tmp/screenshot.png');
const width = Number(args.get('width') ?? 440);
const height = Number(args.get('height') ?? 956);
const fullPage = args.get('fullPage') === 'true';
const port = Number(args.get('port') ?? 9223);
const servePort = Number(args.get('servePort') ?? 4174);
const scenario = args.get('scenario') ?? 'title';
const preset = args.get('preset');
const uiScenario = scenario.startsWith('ui:') ? scenario.slice('ui:'.length) : null;
const checkPage = args.get('check') !== 'false';

const presetJobs = {
  'prep-panel': [
    ['prep-default', 360, 780],
    ['prep-default', 440, 956],
    ['prep-selected-space', 360, 780],
    ['prep-selected-space', 440, 956],
  ],
  'response-panel': [
    ['response-primary', 360, 780],
    ['response-primary', 440, 956],
    ['response-alternate', 360, 780],
    ['response-alternate', 440, 956],
    ['response-danger', 360, 780],
    ['response-danger', 440, 956],
    ['response-many-effects', 360, 780],
    ['response-many-effects', 440, 956],
    ['response-long-label', 360, 780],
    ['response-long-label', 440, 956],
    ['response-fray', 360, 780],
    ['response-fray', 440, 956],
  ],
  'result-panel': [
    ['result-preview', 360, 900],
    ['result-preview', 440, 1040],
    ['result-fray', 360, 960],
    ['result-fray', 440, 1100],
  ],
};
presetJobs['ui-critical'] = [
  ...presetJobs['prep-panel'],
  ...presetJobs['response-panel'],
  ...presetJobs['result-panel'],
];

function withSearchParam(targetUrl, key, value) {
  const next = new URL(targetUrl);
  next.searchParams.set(key, value);
  return next.toString();
}

function runPreset(name) {
  const jobs = presetJobs[name];
  if (!jobs) {
    throw new Error(`Unknown screenshot preset: ${name}. Known presets: ${Object.keys(presetJobs).join(', ')}`);
  }
  const scriptPath = fileURLToPath(import.meta.url);
  const outDir = resolve(args.get('outDir') ?? join('tmp', 'screenshots', name));
  const baseArgs = [];
  if (args.has('url')) baseArgs.push(`--url=${args.get('url')}`);
  if (args.has('check')) baseArgs.push(`--check=${args.get('check')}`);
  jobs.forEach(([jobScenario, jobWidth, jobHeight], index) => {
    const childArgs = [
      scriptPath,
      ...baseArgs,
      `--scenario=ui:${jobScenario}`,
      `--width=${jobWidth}`,
      `--height=${jobHeight}`,
      `--port=${port + index}`,
      `--servePort=${servePort + index}`,
      `--out=${join(outDir, `${jobScenario}-${jobWidth}.png`)}`,
    ];
    const result = spawnSync(process.execPath, childArgs, { stdio: 'inherit' });
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  });
}

if (preset) {
  runPreset(preset);
  process.exit(0);
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error('Chrome or Edge executable was not found. Set CHROME_PATH.');
  return found;
}

async function waitForJson(endpoint, attempts = 50) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return response.json();
    } catch {
      // Chrome is still starting.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${endpoint}`);
}

function createCdpClient(wsUrl) {
  const endpoint = new URL(wsUrl);
  const socket = connect({ host: endpoint.hostname, port: Number(endpoint.port) });
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();
  let buffer = Buffer.alloc(0);
  let handshakeDone = false;
  let messageParts = [];

  const rejectPending = (error) => {
    for (const { reject } of pending.values()) reject(error);
    pending.clear();
  };

  const handleMessage = (data) => {
    try {
      const message = JSON.parse(data);
      if (message.id && pending.has(message.id)) {
        const { resolve: ok, reject } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else ok(message.result ?? {});
        return;
      }
      const callbacks = listeners.get(message.method);
      if (callbacks) callbacks.forEach((callback) => callback(message.params ?? {}, message.sessionId));
    } catch (error) {
      rejectPending(error);
    }
  };

  const writeFrame = (text) => {
    const payload = Buffer.from(text);
    const mask = randomBytes(4);
    const headerLength = payload.length < 126 ? 2 : payload.length < 65536 ? 4 : 10;
    const frame = Buffer.alloc(headerLength + 4 + payload.length);
    frame[0] = 0x81;
    if (payload.length < 126) {
      frame[1] = 0x80 | payload.length;
    } else if (payload.length < 65536) {
      frame[1] = 0x80 | 126;
      frame.writeUInt16BE(payload.length, 2);
    } else {
      frame[1] = 0x80 | 127;
      frame.writeBigUInt64BE(BigInt(payload.length), 2);
    }
    mask.copy(frame, headerLength);
    for (let i = 0; i < payload.length; i += 1) {
      frame[headerLength + 4 + i] = payload[i] ^ mask[i % 4];
    }
    socket.write(frame);
  };

  const parseFrames = () => {
    while (buffer.length >= 2) {
      const first = buffer[0];
      const second = buffer[1];
      const opcode = first & 0x0f;
      const finalFrame = (first & 0x80) !== 0;
      const masked = (second & 0x80) !== 0;
      let length = second & 0x7f;
      let offset = 2;

      if (length === 126) {
        if (buffer.length < offset + 2) return;
        length = buffer.readUInt16BE(offset);
        offset += 2;
      } else if (length === 127) {
        if (buffer.length < offset + 8) return;
        length = Number(buffer.readBigUInt64BE(offset));
        offset += 8;
      }

      const maskOffset = offset;
      if (masked) offset += 4;
      if (buffer.length < offset + length) return;

      let payload = buffer.subarray(offset, offset + length);
      if (masked) {
        const mask = buffer.subarray(maskOffset, maskOffset + 4);
        payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
      }
      buffer = buffer.subarray(offset + length);

      if (opcode === 0x8) {
        socket.end();
        rejectPending(new Error(`CDP socket closed: ${wsUrl}`));
        return;
      }
      if (opcode === 0x9) {
        continue;
      }
      if (opcode === 0x1 || opcode === 0x0) {
        messageParts.push(payload);
        if (finalFrame) {
          handleMessage(Buffer.concat(messageParts).toString('utf8'));
          messageParts = [];
        }
      }
    }
  };

  const ready = new Promise((resolveReady, rejectReady) => {
    socket.once('connect', () => {
      const key = randomBytes(16).toString('base64');
      const path = `${endpoint.pathname}${endpoint.search}`;
      socket.write([
        `GET ${path} HTTP/1.1`,
        `Host: ${endpoint.host}`,
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Key: ${key}`,
        'Sec-WebSocket-Version: 13',
        `Origin: http://${endpoint.host}`,
        '',
        '',
      ].join('\r\n'));
    });
    socket.once('error', rejectReady);
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!handshakeDone) {
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) return;
        const header = buffer.subarray(0, headerEnd).toString('utf8');
        if (!header.includes(' 101 ')) {
          rejectReady(new Error(`CDP WebSocket handshake failed: ${header.split('\r\n')[0]}`));
          socket.end();
          return;
        }
        handshakeDone = true;
        buffer = buffer.subarray(headerEnd + 4);
        resolveReady();
      }
      parseFrames();
    });
  });
  socket.on('error', (error) => rejectPending(error));
  socket.on('close', () => rejectPending(new Error(`CDP socket closed: ${wsUrl}`)));

  return {
    ready,
    send(method, params = {}, sessionId) {
      const id = nextId;
      nextId += 1;
      const payload = sessionId ? { id, method, params, sessionId } : { id, method, params };
      const promise = new Promise((resolvePromise, rejectPromise) => {
        const timeout = setTimeout(() => {
          pending.delete(id);
          rejectPromise(new Error(`Timed out waiting for CDP response: ${method}`));
        }, 10000);
        pending.set(id, {
          resolve: (value) => {
            clearTimeout(timeout);
            resolvePromise(value);
          },
          reject: (error) => {
            clearTimeout(timeout);
            rejectPromise(error);
          },
        });
      });
      writeFrame(JSON.stringify(payload));
      return promise;
    },
    once(method, predicate = () => true) {
      return new Promise((resolveEvent) => {
        const callback = (params, sessionId) => {
          if (!predicate(params, sessionId)) return;
          const callbacks = listeners.get(method);
          callbacks.delete(callback);
          resolveEvent({ params, sessionId });
        };
        if (!listeners.has(method)) listeners.set(method, new Set());
        listeners.get(method).add(callback);
      });
    },
    close() {
      socket.end();
    },
  };
}

const profileDir = resolve(tmpdir(), 'cue-crew-chrome-cdp-profile', `${Date.now()}-${process.pid}`);
await rm(profileDir, { recursive: true, force: true });
await mkdir(profileDir, { recursive: true });

let staticServer;
if (!url) {
  const distRoot = resolve('dist');
  if (!existsSync(join(distRoot, 'index.html'))) {
    throw new Error('dist/index.html was not found. Run npm run build first, or pass --url=http://...');
  }
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  staticServer = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', `http://127.0.0.1:${servePort}`);
      const relativePath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
      const filePath = join(distRoot, relativePath);
      const file = await import('node:fs/promises').then((fs) => fs.readFile(filePath));
      response.writeHead(200, { 'content-type': types[extname(filePath)] ?? 'application/octet-stream' });
      response.end(file);
    } catch {
      const file = await import('node:fs/promises').then((fs) => fs.readFile(join(distRoot, 'index.html')));
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(file);
    }
  });
  await new Promise((resolveListen) => staticServer.listen(servePort, '127.0.0.1', resolveListen));
  url = `http://127.0.0.1:${servePort}`;
}

const chrome = spawn(findChrome(), [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  `--window-size=${width},${height}`,
  'about:blank',
], { stdio: 'ignore' });

let client;
try {
  const targets = await waitForJson(`http://127.0.0.1:${port}/json`);
  const pageTarget = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
  if (!pageTarget) throw new Error('Chrome page target was not found.');
  client = createCdpClient(pageTarget.webSocketDebuggerUrl);
  await client.ready;

  const sessionId = undefined;
  await client.send('Page.enable', {}, sessionId);
  await client.send('Runtime.enable', {}, sessionId);
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 700,
    screenWidth: width,
    screenHeight: height,
  }, sessionId);

  if (uiScenario) {
    url = withSearchParam(url, 'uiScenario', uiScenario);
  }
  const loaded = client.once('Page.loadEventFired', (_params, eventSessionId) => eventSessionId === sessionId);
  await client.send('Page.navigate', { url }, sessionId);
  await loaded;
  await client.send('Runtime.evaluate', {
    expression: 'document.fonts ? document.fonts.ready.then(() => true) : true',
    awaitPromise: true,
  }, sessionId);

  if (scenario !== 'title' && !uiScenario) {
    await runScenario(client, sessionId, scenario);
  }
  await client.send('Runtime.evaluate', {
    expression: 'window.scrollTo(0, 0)',
  }, sessionId);
  await delay(250);
  if (checkPage) {
    await assertPageHealth(client, sessionId, uiScenario ?? scenario);
  }

  let captureParams = { format: 'png', fromSurface: true };
  if (fullPage) {
    const metrics = await client.send('Page.getLayoutMetrics', {}, sessionId);
    const size = metrics.cssContentSize;
    captureParams = {
      ...captureParams,
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 },
    };
  }
  const { data } = await client.send('Page.captureScreenshot', captureParams, sessionId);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(data, 'base64'));
  console.log(out);
} finally {
  if (client) client.close();
  chrome.kill();
  if (staticServer) {
    await new Promise((resolveClose) => staticServer.close(resolveClose));
  }
}

async function runScenario(client, sessionId, name) {
  const clickByText = async (text) => {
    const expression = `
      (() => {
        const target = Array.from(document.querySelectorAll('button'))
          .find((button) => button.textContent.trim().replace(/\\s+/g, ' ').includes(${JSON.stringify(text)}));
        if (!target) return false;
        target.click();
        return true;
      })()
    `;
    let clicked = false;
    for (let i = 0; i < 15; i += 1) {
      const result = await client.send('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
      if (result.result.value) {
        clicked = true;
        break;
      }
      await delay(100);
    }
    if (!clicked) throw new Error(`Button was not found: ${text}`);
    await delay(120);
  };

  if (name === 'game') {
    await clickByText('はじめる');
    return;
  }

  if (name === 'prepSpace') {
    await clickByText('はじめる');
    await clickByText('余白');
    return;
  }

  if (name === 'preview') {
    await clickByText('はじめる');
    await clickByText('注視');
    await clickByText('この準備で本番へ');
    await clickByText('拾う');
    await clickByText('この対応を送る');
    return;
  }

  if (name === 'response') {
    await clickByText('はじめる');
    await clickByText('注視');
    await clickByText('この準備で本番へ');
    await delay(1300);
    return;
  }

  if (name === 'cue') {
    await clickByText('はじめる');
    await clickByText('注視');
    await clickByText('この準備で本番へ');
    return;
  }

  if (name === 'repeatResponse') {
    await clickByText('はじめる');
    await clickByText('注視');
    await clickByText('この準備で本番へ');
    await clickByText('拾う');
    await clickByText('この対応を送る');
    await clickByText('この結果で');
    await clickByText('注視');
    await clickByText('この準備で本番へ');
    return;
  }

  if (name === 'repeatPreview') {
    await clickByText('はじめる');
    await clickByText('注視');
    await clickByText('この準備で本番へ');
    await clickByText('拾う');
    await clickByText('この対応を送る');
    await clickByText('この結果で');
    await clickByText('注視');
    await clickByText('この準備で本番へ');
    await clickByText('拾う');
    await clickByText('この対応を送る');
    return;
  }

  if (name === 'stylePreview') {
    await clickByText('はじめる');
    await clickByText('注視');
    await clickByText('この準備で本番へ');
    await clickByText('拾う');
    await clickByText('この対応を送る');
    await clickByText('この結果で');
    await clickByText('注視');
    await clickByText('この準備で本番へ');
    await clickByText('拾う');
    await clickByText('この対応を送る');
    return;
  }

  if (name === 'result') {
    await clickByText('はじめる');
    for (let i = 0; i < 6; i += 1) {
      await clickByText('注視');
      await clickByText('この準備で本番へ');
      await clickByText('拾う');
      await clickByText('この対応を送る');
      await clickByText('この結果で');
    }
    return;
  }

  throw new Error(`Unknown screenshot scenario: ${name}`);
}

async function assertPageHealth(client, sessionId, name) {
  const expression = `
    (() => {
      const failures = [];
      const visibleRect = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width <= 0 || rect.height <= 0) return null;
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      const intersects = (a, b) => (
        Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
        Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
      );
      const html = document.documentElement;
      if (html.scrollWidth > html.clientWidth + 1) {
        failures.push(\`horizontal overflow: scrollWidth \${html.scrollWidth}, clientWidth \${html.clientWidth}\`);
      }
      if ((document.body?.innerText ?? '').trim().length < 20) {
        failures.push('page appears blank');
      }
      if (/vite|webpack|runtime error|failed to fetch/i.test(document.body?.innerText ?? '') && document.querySelector('[plugin], vite-error-overlay')) {
        failures.push('framework error overlay text detected');
      }
      document.querySelectorAll('button').forEach((button) => {
        const rect = visibleRect(button);
        if (!rect) return;
        if (button.scrollWidth > button.clientWidth + 2) {
          failures.push(\`button horizontal overflow: "\${button.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40)}"\`);
        }
        if (button.scrollHeight > button.clientHeight + 2 && getComputedStyle(button).overflow !== 'visible') {
          failures.push(\`button vertical overflow: "\${button.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40)}"\`);
        }
      });
      document.querySelectorAll('.choice-grid').forEach((grid, gridIndex) => {
        const items = Array.from(grid.children).map((element) => ({ element, rect: visibleRect(element) })).filter((item) => item.rect);
        for (let i = 0; i < items.length; i += 1) {
          for (let j = i + 1; j < items.length; j += 1) {
            if (intersects(items[i].rect, items[j].rect) > 1) {
              failures.push(\`choice-grid \${gridIndex} overlapping items: \${i} and \${j}\`);
            }
          }
        }
      });
      document.querySelectorAll('.response-choice').forEach((card) => {
        const rect = visibleRect(card);
        if (rect && rect.height < 120) failures.push('response card is shorter than expected');
      });
      if (${JSON.stringify(name)}.startsWith('prep-') && document.querySelector('.selection-marker--response.is-visible')) {
        failures.push('response selection marker is visible in prep scenario');
      }
      if (${JSON.stringify(name)}.startsWith('response-') && document.querySelector('.selection-marker--prep.is-visible')) {
        failures.push('prep selection marker is visible in response scenario');
      }
      return failures;
    })()
  `;
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
  const failures = result.result.value ?? [];
  if (failures.length) {
    throw new Error(`UI health check failed for ${name}: ${failures.join('; ')}`);
  }
}
