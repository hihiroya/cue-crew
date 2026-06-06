import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  }),
);

const presetJobs = {
  'title-panel': [
    ['title-default', 360, 780],
    ['title-default', 440, 956],
    ['title-history-legacy', 360, 780],
    ['title-history-legacy', 440, 956],
    ['title-collection', 360, 900],
    ['title-collection', 440, 1040],
  ],
  'prep-panel': [
    ['prep-default', 360, 780],
    ['prep-default', 390, 844],
    ['prep-default', 440, 956],
    ['prep-selected-space', 360, 780],
    ['prep-selected-space', 440, 956],
  ],
  'response-panel': [
    ['response-primary', 360, 780],
    ['response-primary', 390, 844],
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
    ['result-preview', 390, 900],
    ['result-preview', 440, 1040],
    ['result-fray', 360, 960],
    ['result-fray', 440, 1100],
    ['finished-heat', 360, 1500],
    ['finished-heat', 440, 1500],
    ['finished-rough', 360, 1500],
    ['finished-rough', 440, 1500],
  ],
};
presetJobs['ui-critical'] = [
  ...presetJobs['title-panel'],
  ...presetJobs['prep-panel'],
  ...presetJobs['response-panel'],
  ...presetJobs['result-panel'],
];

const defaultWidth = Number(args.get('width') ?? 440);
const defaultHeight = Number(args.get('height') ?? 956);
const port = Number(args.get('port') ?? 9224);
const servePort = Number(args.get('servePort') ?? 4175);
const preset = args.get('preset') ?? 'ui-critical';
const scenario = args.get('scenario');

await main();

async function main() {
  const jobs = scenario
    ? [[scenario.replace(/^ui:/, ''), defaultWidth, defaultHeight]]
    : presetJobs[preset];

  if (!jobs) {
    throw new Error(`Unknown UI check preset: ${preset}. Known presets: ${Object.keys(presetJobs).join(', ')}`);
  }

  const env = await createCheckEnvironment({
    baseUrl: args.get('url'),
    initialWidth: jobs[0][1],
    initialHeight: jobs[0][2],
    port,
    servePort,
  });

  const failures = [];
  try {
    for (const [jobScenario, width, height] of jobs) {
      const result = await checkInEnvironment(env, { scenario: jobScenario, width, height });
      if (result.failures.length) {
        failures.push({ scenario: jobScenario, width, height, failures: result.failures });
      }
      const label = result.failures.length ? 'FAIL' : 'ok';
      console.log(`${label} ${jobScenario} ${width}x${height}`);
    }
  } finally {
    await env.close();
  }

  if (failures.length) {
    const message = failures
      .map((item) => [
        `${item.scenario} ${item.width}x${item.height}`,
        ...item.failures.map((failure) => `  - ${failure}`),
      ].join('\n'))
      .join('\n');
    throw new Error(`UI layout check failed:\n${message}`);
  }
}

async function createCheckEnvironment({ baseUrl, initialWidth, initialHeight, port: chromePort, servePort: staticPort }) {
  let staticServer;
  let url = baseUrl;

  if (!url) {
    staticServer = await startStaticServer(staticPort);
    url = staticServer.url;
  }

  const profileDir = resolve(tmpdir(), 'cue-crew-ui-check-profile', `${Date.now()}-${process.pid}`);
  await rm(profileDir, { recursive: true, force: true });

  const chrome = spawn(findChrome(), [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-allow-origins=*',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${profileDir}`,
    `--window-size=${initialWidth},${initialHeight}`,
    'about:blank',
  ], { stdio: 'ignore' });

  const targets = await waitForJson(`http://127.0.0.1:${chromePort}/json`);
  const pageTarget = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
  if (!pageTarget) throw new Error('Chrome page target was not found.');

  const client = createCdpClient(pageTarget.webSocketDebuggerUrl);
  await client.ready;
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Log.enable');

  const runtimeFailures = [];
  client.on('Runtime.exceptionThrown', (params) => {
    const details = params.exceptionDetails;
    runtimeFailures.push(`runtime exception: ${details?.text ?? 'unknown exception'}`);
  });
  client.on('Runtime.consoleAPICalled', (params) => {
    if (!['error', 'assert'].includes(params.type)) return;
    const text = params.args?.map((arg) => arg.value ?? arg.description ?? arg.type).join(' ') ?? params.type;
    runtimeFailures.push(`console ${params.type}: ${text}`);
  });
  client.on('Log.entryAdded', (params) => {
    if (!['error', 'warning'].includes(params.entry?.level)) return;
    runtimeFailures.push(`browser ${params.entry.level}: ${params.entry.text}`);
  });

  return {
    baseUrl: url,
    client,
    runtimeFailures,
    async close() {
      client.close();
      await stopChrome(chrome);
      if (staticServer) await staticServer.close();
      await rm(profileDir, { recursive: true, force: true }).catch(() => {});
    },
  };
}

async function checkInEnvironment(env, options) {
  env.runtimeFailures.length = 0;
  const targetUrl = withSearchParam(env.baseUrl, 'uiScenario', options.scenario);

  await env.client.send('Emulation.setDeviceMetricsOverride', {
    width: options.width,
    height: options.height,
    deviceScaleFactor: 1,
    mobile: options.width < 700,
    screenWidth: options.width,
    screenHeight: options.height,
  });

  const loaded = env.client.once('Page.loadEventFired');
  await env.client.send('Page.navigate', { url: targetUrl });
  await loaded;
  await env.client.send('Runtime.evaluate', {
    expression: 'document.fonts ? document.fonts.ready.then(() => true) : true',
    awaitPromise: true,
  });
  await env.client.send('Runtime.evaluate', {
    expression: 'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
    awaitPromise: true,
  });

  await runScenarioInteraction(env.client, options.scenario);
  await env.client.send('Runtime.evaluate', {
    expression: 'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
    awaitPromise: true,
  });

  const layoutFailures = await assertPageHealth(env.client, options.scenario);
  return { failures: [...env.runtimeFailures, ...layoutFailures] };
}

async function runScenarioInteraction(client, scenario) {
  const expression = `
    (() => {
      const click = (selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return false;
        element.click();
        return true;
      };
      if (${JSON.stringify(scenario)}.startsWith('prep-')) {
        click('.prep-choice:not([disabled])');
        click('.prep-commit-action:not([disabled])');
      }
      if (${JSON.stringify(scenario)}.startsWith('response-')) {
        click('.response-choice:not([disabled])');
      }
      if (${JSON.stringify(scenario)}.startsWith('finished-')) {
        click('.result-record-details > summary');
      }
      return true;
    })()
  `;
  await client.send('Runtime.evaluate', { expression, awaitPromise: true });
}

async function startStaticServer(staticPort) {
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

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', `http://127.0.0.1:${staticPort}`);
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

  await new Promise((resolveListen) => server.listen(staticPort, '127.0.0.1', resolveListen));

  return {
    url: `http://127.0.0.1:${staticPort}`,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
  };
}

async function stopChrome(chrome) {
  if (chrome.exitCode !== null) return;
  const exited = new Promise((resolveExit) => chrome.once('exit', resolveExit));
  chrome.kill();
  await Promise.race([exited, delay(1500)]);
}

function withSearchParam(targetUrl, key, value) {
  const next = new URL(targetUrl);
  next.searchParams.set(key, value);
  return next.toString();
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
      if (opcode === 0x9) continue;
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
          if (callbacks) callbacks.delete(callback);
          resolveEvent({ params, sessionId });
        };
        if (!listeners.has(method)) listeners.set(method, new Set());
        listeners.get(method).add(callback);
      });
    },
    on(method, callback) {
      if (!listeners.has(method)) listeners.set(method, new Set());
      listeners.get(method).add(callback);
      return () => listeners.get(method)?.delete(callback);
    },
    close() {
      socket.end();
    },
  };
}

async function assertPageHealth(client, name) {
  const expression = `
    (() => {
      const failures = [];
      const visibleRect = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width <= 0 || rect.height <= 0) return null;
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      const intersectionArea = (a, b) => (
        Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
        Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
      );
      const label = (element) => {
        const className = typeof element.className === 'string' ? element.className : '';
        const text = element.textContent?.trim().replace(/\\s+/g, ' ').slice(0, 48) || element.tagName.toLowerCase();
        return className ? \`\${element.tagName.toLowerCase()}.\${className.replace(/\\s+/g, '.')}: "\${text}"\` : \`\${element.tagName.toLowerCase()}: "\${text}"\`;
      };
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
        const style = getComputedStyle(button);
        if (button.scrollWidth > button.clientWidth + 2) {
          failures.push(\`button horizontal overflow: \${label(button)}\`);
        }
        if (button.scrollHeight > button.clientHeight + 2 && style.overflow !== 'visible') {
          failures.push(\`button vertical overflow: \${label(button)}\`);
        }
        if (!button.disabled && (rect.width < 36 || rect.height < 36)) {
          failures.push(\`active button tap target is too small: \${label(button)} \${Math.round(rect.width)}x\${Math.round(rect.height)}\`);
        }
      });

      const requiredVisibleSelectors = [
        '.game-shell, .title-screen, .result-screen',
        '.phase-strip, .title-panel, .result-hero',
      ];
      requiredVisibleSelectors.forEach((selector) => {
        if (!document.querySelector(selector)) {
          failures.push(\`required surface missing: \${selector}\`);
        }
      });

      const criticalSelectors = [
        '.game-shell',
        '.game-header',
        '.phase-strip',
        '.action-slot',
        '.choice-panel',
        '.choice-grid',
        '.choice-button',
        '.response-choice',
        '.result-preview',
        '.result-screen',
        '.result-hero',
        '.packet-panel',
      ];
      document.querySelectorAll(criticalSelectors.join(',')).forEach((element) => {
        const rect = visibleRect(element);
        if (!rect) return;
        if (rect.left < -1 || rect.right > innerWidth + 1) {
          failures.push(\`critical element extends outside viewport horizontally: \${label(element)}\`);
        }
        if (rect.width < 24 || rect.height < 12) {
          failures.push(\`critical element collapsed: \${label(element)} \${Math.round(rect.width)}x\${Math.round(rect.height)}\`);
        }
      });

      document.querySelectorAll('.choice-grid').forEach((grid, gridIndex) => {
        const items = Array.from(grid.children).map((element) => ({ element, rect: visibleRect(element) })).filter((item) => item.rect);
        for (let i = 0; i < items.length; i += 1) {
          for (let j = i + 1; j < items.length; j += 1) {
            if (intersectionArea(items[i].rect, items[j].rect) > 1) {
              failures.push(\`choice-grid \${gridIndex} overlapping items: \${i} and \${j}\`);
            }
          }
        }
      });

      document.querySelectorAll('.response-choice').forEach((card) => {
        const rect = visibleRect(card);
        if (rect && rect.height < 120) failures.push(\`response card is shorter than expected: \${label(card)}\`);
      });
      document.querySelectorAll('details[open]').forEach((details) => {
        const rect = visibleRect(details);
        if (!rect) return;
        if (details.scrollWidth > details.clientWidth + 2) {
          failures.push(\`open details horizontal overflow: \${label(details)}\`);
        }
        const content = Array.from(details.children).find((child) => child.tagName.toLowerCase() !== 'summary');
        const contentRect = content ? visibleRect(content) : null;
        if (content && !contentRect) {
          failures.push(\`open details content is not visible: \${label(details)}\`);
        }
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
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true });
  return result.result.value ?? [];
}
