import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const baseUrl = process.argv.find(value => value.startsWith('http')) || 'http://127.0.0.1:4200';
const output = resolve('.migration-evidence', 'phase3');
const edge = [
  process.env.RAID_OPS_BROWSER_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(value => value && existsSync(value));
const sleep = milliseconds => new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds));

async function freePort() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolvePromise(address.port));
    });
  });
}

async function targetFor(port) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
      const page = targets.find(target => target.type === 'page');
      if (page?.webSocketDebuggerUrl) return page;
    } catch {}
    await sleep(125);
  }
  throw new Error('Browser DevTools target unavailable');
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.sequence = 0;
    this.pending = new Map();
  }
  async open() {
    await new Promise((resolvePromise, reject) => {
      this.socket.addEventListener('open', resolvePromise, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result || {});
    });
  }
  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { this.socket.close(); }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result?.value;
}

async function navigate(cdp, path) {
  await cdp.send('Page.navigate', { url: new URL(path, baseUrl).href });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await evaluate(cdp, 'document.readyState') === 'complete') break;
    await sleep(100);
  }
  await sleep(500);
}

async function capture(cdp, name) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(join(output, `${name}.png`), Buffer.from(result.data, 'base64'));
}

if (!edge) throw new Error('Microsoft Edge not found; set RAID_OPS_BROWSER_PATH');
await mkdir(output, { recursive: true });
const port = await freePort();
const profile = await mkdtemp(join(tmpdir(), 'raid-ops-phase3-'));
const browser = spawn(edge, [
  '--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });
const errors = [];
const requests = [];
const audits = [];

try {
  const cdp = new Cdp((await targetFor(port)).webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  cdp.socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.text || 'Runtime exception');
    if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
  });

  for (const viewport of [
    { id: 'desktop', width: 1440, height: 900, mobile: false },
    { id: 'mobile', width: 390, height: 844, mobile: true },
  ]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1 });
    for (const route of ['foundation', 'mechanics']) {
      await navigate(cdp, `/${route}`);
      const audit = await evaluate(cdp, `(() => ({
        title: document.title,
        heading: document.querySelector('main h1')?.textContent?.trim() || '',
        bodyLength: document.body?.innerText?.trim().length || 0,
        overlay: Boolean(document.querySelector('.vite-error-overlay, #webpack-dev-server-client-overlay')),
        overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        currentOwner: document.body?.innerText?.includes('CURRENT OWNER') || false,
        legacyOwner: document.body?.innerText?.includes('LEGACY') || false
      }))()`);
      audits.push({ viewport: viewport.id, route, ...audit });
      await capture(cdp, `${viewport.id}-${route}`);
    }
  }
  await cdp.send('Browser.close').catch(() => {});
  cdp.close();
} finally {
  if (!browser.killed) browser.kill();
  await sleep(250);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

const apiRequests = requests.filter(url => new URL(url).pathname.startsWith('/api/'));
const failures = audits.filter(audit => audit.bodyLength === 0 || audit.overlay || audit.overflow > 0 || !audit.heading);
if (audits.filter(audit => audit.route === 'mechanics').some(audit => !audit.currentOwner || !audit.legacyOwner)) {
  failures.push({ route: 'mechanics', reason: 'legacy ownership is not explicit' });
}
const report = { schemaVersion: 'phase3-foundation-visual-v1', baseUrl, audits, errors, apiRequests };
await writeFile(join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
if (errors.length || apiRequests.length || failures.length) {
  console.error(JSON.stringify({ errors, apiRequests, failures }, null, 2));
  process.exit(1);
}
console.log(`[visual] PASS - ${audits.length} route/viewport checks - 0 browser errors - 0 API requests`);
