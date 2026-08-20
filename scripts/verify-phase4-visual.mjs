import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const baseUrl = process.argv.find(value => value.startsWith('http')) || 'http://127.0.0.1:4200';
const baseOrigin = new URL(baseUrl).origin;
const output = resolve('.migration-evidence', 'phase4');
const evidenceContract = { scopeIdentity: 'encounter+difficulty', crossDifficultyComparisonForbidden: true };
const stages = [
  { absoluteStageIndex: 1, semanticPhaseId: 1, startTime: 1_000, endTime: 71_000 },
  { absoluteStageIndex: 2, semanticPhaseId: 2, startTime: 71_000, endTime: 151_000 },
  { absoluteStageIndex: 3, semanticPhaseId: 1, startTime: 151_000, endTime: 201_000 },
];
const encounter = { id: 3010, name: 'Sanitized Encounter', difficulty: 5, difficultyName: 'Mythic', scopeKey: '3010:d5', pulls: 4 };
const bestPull = { fightId: 77, pullNumber: 4, fightPercentage: 12.5, durationMs: 200_000, stages };
const telemetryFixture = {
  ok: true, generatedAt: 1787230800000, reportCode: 'SANITIZED01', encounter, bestPull,
  phaseModel: { kind: 'absolute-stage', bestPullStages: stages, semanticPhaseSequence: [1, 2, 1] },
  analysisPopulation: { rawPulls: 5, eligiblePulls: 4, excludedPulls: [{}], policy: 'called-wipe/reset pulls excluded; difficulty never mixed' },
  throughput: {
    best: { damage: 274_000_000, healing: 47_000_000, dps: 1_370_000, hps: 235_000 },
    phases: {
      p1: { damage: 91_000_000, healing: 18_000_000, dps: 1_300_000, hps: 257_143 },
      p2: { damage: 104_000_000, healing: 20_000_000, dps: 1_300_000, hps: 250_000 },
      p3: { damage: 79_000_000, healing: 9_000_000, dps: 1_580_000, hps: 180_000 },
    },
  },
  graphs: {
    damage: { data: { series: [{ name: 'Total', data: [410000, 760000, 590000, 980000, 720000, 1120000, 860000, 1370000, 1010000, 1490000, 1280000] }] } },
    healing: { data: { series: [{ name: 'Total', data: [90000, 180000, 130000, 290000, 210000, 330000, 190000, 270000, 160000, 240000, 120000] }] } },
  },
  players: [
    { actorId: 1, name: 'Aster', className: 'Warrior', spec: 'Protection', itemLevel: 640, role: 'TANK', server: 'Draenor', bestPull: { dps: 210000, hps: 0 }, character: { gear: [{ id: 12345, name: 'Sanitized Helm', itemLevel: 639, slot: 'Head' }], gearCount: 1, talents: [{ entryId: 10, spellId: 100, rank: 1, name: 'Defensive Stance' }], talentCount: 1, talentImportCode: null, talentWowheadUrl: null, combatantInfoSource: 'WCL CombatantInfo' }, reliability: { value: null, status: 'shadow-pending', confidence: 'unknown', reason: 'Publication gate pending.' } },
    { actorId: 2, name: 'Birch', className: 'Priest', spec: 'Holy', itemLevel: 642, role: 'HEAL', server: 'Draenor', bestPull: { dps: 12000, hps: 320000 }, character: { gear: [], gearCount: 0, talents: [], talentCount: 0, talentImportCode: null, talentWowheadUrl: null, combatantInfoSource: null }, reliability: { value: null, status: 'shadow-pending', confidence: 'unknown', reason: 'Publication gate pending.' } },
    { actorId: 3, name: 'Cinder', className: 'Monk', spec: 'Windwalker', itemLevel: 641, role: 'DPS', server: 'Draenor', bestPull: { dps: 430000, hps: 0 }, character: { gear: [], gearCount: 0, talents: [], talentCount: 0, talentImportCode: 'sanitized', talentWowheadUrl: 'https://www.wowhead.com/talent-calc/blizzard/sanitized', combatantInfoSource: 'WCL CombatantInfo' }, reliability: { value: null, status: 'shadow-pending', confidence: 'unknown', reason: 'Publication gate pending.' } },
    { actorId: 4, name: 'Dawn', className: 'Mage', spec: 'Frost', itemLevel: null, role: null, server: null, bestPull: { dps: 390000, hps: 0 }, character: { gear: [], gearCount: 0, talents: [{ entryId: 11, spellId: null, rank: 1, name: 'Node 999' }], talentCount: 1, talentImportCode: null, talentWowheadUrl: null, combatantInfoSource: 'WCL CombatantInfo' }, reliability: { value: null, status: 'shadow-pending', confidence: 'unknown', reason: 'Publication gate pending.' } },
  ],
  playerProfiles: { coverage: { roster: 4, withGear: 1, withTalents: 2, gearPct: 25, talentPct: 50 }, source: 'CombatantInfo events with playerDetails fallback' },
  errors: { talentImports: 'sanitized partial provider' }, evidence: { source: 'Warcraft Logs API v2' }, evidenceContract,
};
const partialTelemetryFixture = { ...telemetryFixture, graphs: { ...telemetryFixture.graphs, healing: null } };
const reportFixture = {
  ok: true, generatedAt: 1787230800000, source: 'Warcraft Logs API v2', configured: { reportCode: 'SANITIZED01' }, report: { code: 'SANITIZED01' },
  encounter, phaseModel: { kind: 'absolute-stage', semanticPhaseIdsMayRepeat: true }, analysisPopulation: telemetryFixture.analysisPopulation,
  overview: { bestPull, raidDps: 1_370_000, raidHps: 235_000, executeDps: 1_580_000, overhealPct: 24.6 },
  diagnostics: { detailStatus: 'ready' }, evidenceContract,
};
const bodies = {
  report: Buffer.from(JSON.stringify(reportFixture)).toString('base64'),
  telemetry: Buffer.from(JSON.stringify(telemetryFixture)).toString('base64'),
  partialTelemetry: Buffer.from(JSON.stringify(partialTelemetryFixture)).toString('base64'),
};
let partialMode = false;
let currentSurface = 'unknown';
const edge = [process.env.RAID_OPS_BROWSER_PATH, 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(value => value && existsSync(value));
const sleep = milliseconds => new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds));

async function freePort() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { const address = server.address(); server.close(() => resolvePromise(address.port)); });
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
  constructor(url) { this.socket = new WebSocket(url); this.sequence = 0; this.pending = new Map(); }
  async open() {
    await new Promise((resolvePromise, reject) => { this.socket.addEventListener('open', resolvePromise, { once: true }); this.socket.addEventListener('error', reject, { once: true }); });
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data); const pending = this.pending.get(message.id); if (!pending) return;
      this.pending.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result || {});
    });
  }
  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolvePromise, reject) => { this.pending.set(id, { resolve: resolvePromise, reject }); this.socket.send(JSON.stringify({ id, method, params })); });
  }
  close() { this.socket.close(); }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result?.value;
}

async function navigate(cdp, path, readyText) {
  partialMode = path.includes('visual=partial');
  currentSurface = path.startsWith('/composition') ? 'composition' : path.startsWith('/damage-healing') ? 'damage-healing' : 'unknown';
  await cdp.send('Page.navigate', { url: new URL(path, baseUrl).href });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await evaluate(cdp, `document.readyState === 'complete' && document.body?.innerText?.includes(${JSON.stringify(readyText)})`);
    if (ready) break;
    await sleep(100);
  }
  await sleep(250);
}

async function capture(cdp, surface, name) {
  const directory = join(output, surface); await mkdir(directory, { recursive: true });
  const metrics = await cdp.send('Page.getLayoutMetrics'); const size = metrics.cssContentSize || metrics.contentSize;
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: true, clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 } });
  await writeFile(join(directory, `${name}.png`), Buffer.from(result.data, 'base64'));
}

async function audit(cdp, viewport, surface, state) {
  const result = await evaluate(cdp, `(() => ({
    title: document.title, heading: document.querySelector('main h1')?.textContent?.trim() || '', bodyLength: document.body?.innerText?.trim().length || 0,
    overlay: Boolean(document.querySelector('.vite-error-overlay, #webpack-dev-server-client-overlay')),
    overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    contextRequired: document.body?.innerText?.includes('CONTEXT REQUIRED') || false,
    rosterReady: document.body?.innerText?.includes('Roster intelligence') || false,
    throughputReady: document.body?.innerText?.includes('Throughput diagnostics') || false,
    partialVisible: document.body?.innerText?.includes('PARTIAL EVIDENCE') || false,
    graphVisible: Boolean(document.querySelector('app-throughput-chart svg polyline')),
    graphUnavailable: document.body?.innerText?.includes('GRAPH UNAVAILABLE') || false,
    healingSelected: document.querySelector('.mode-toggle button[aria-pressed="true"]')?.textContent?.trim() === 'Healing',
    fixtureLeak: ['92%', '184 GUILDS', '18.7M', '1.82M', '21.4M', '28.7%', '1.4s', 'Execute DPS'].some(value => document.body?.innerText?.includes(value))
  }))()`);
  const entry = { viewport, surface, state, ...result };
  audits.push(entry); await capture(cdp, surface, `${viewport}-${state}`); return entry;
}

if (!edge) throw new Error('Microsoft Edge not found; set RAID_OPS_BROWSER_PATH');
await mkdir(output, { recursive: true });
const port = await freePort(); const profile = await mkdtemp(join(tmpdir(), 'raid-ops-phase4-'));
const browser = spawn(edge, ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
const errors = []; const requests = []; const audits = [];

try {
  const cdp = new Cdp((await targetFor(port)).webSocketDebuggerUrl); await cdp.open();
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Network.enable'); await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  cdp.socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.text || 'Runtime exception');
    if (message.method === 'Network.requestWillBeSent') requests.push({ url: message.params.request.url, surface: currentSurface });
    if (message.method !== 'Fetch.requestPaused') return;
    const url = new URL(message.params.request.url); const pathname = url.pathname;
    if (pathname === '/api/wcl/report' || pathname === '/api/wcl/telemetry') {
      const body = pathname.endsWith('/report') ? bodies.report : partialMode ? bodies.partialTelemetry : bodies.telemetry;
      void cdp.send('Fetch.fulfillRequest', { requestId: message.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body });
    } else if (url.origin !== baseOrigin) void cdp.send('Fetch.failRequest', { requestId: message.params.requestId, errorReason: 'BlockedByClient' });
    else void cdp.send('Fetch.continueRequest', { requestId: message.params.requestId });
  });

  for (const viewport of [{ id: 'desktop', width: 1440, height: 900, mobile: false }, { id: 'mobile', width: 390, height: 844, mobile: true }]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1 });
    await navigate(cdp, '/composition', 'CONTEXT REQUIRED'); await audit(cdp, viewport.id, 'composition', 'context');
    await navigate(cdp, '/composition?report=SANITIZED01&encounter=3010&difficulty=5', 'Roster intelligence'); await evaluate(cdp, `document.querySelector('.player-row summary')?.click()`); await audit(cdp, viewport.id, 'composition', 'ready');
    await navigate(cdp, '/damage-healing', 'CONTEXT REQUIRED'); await audit(cdp, viewport.id, 'damage-healing', 'context');
    await navigate(cdp, '/damage-healing?report=SANITIZED01&encounter=3010&difficulty=5', 'Throughput diagnostics'); await audit(cdp, viewport.id, 'damage-healing', 'ready-damage');
    await evaluate(cdp, `[...document.querySelectorAll('.mode-toggle button')].find(button => button.textContent.trim() === 'Healing')?.click()`); await sleep(100); await audit(cdp, viewport.id, 'damage-healing', 'ready-healing');
    await navigate(cdp, '/damage-healing?report=SANITIZED01&encounter=3010&difficulty=5&visual=partial', 'PARTIAL EVIDENCE'); await evaluate(cdp, `[...document.querySelectorAll('.mode-toggle button')].find(button => button.textContent.trim() === 'Healing')?.click()`); await sleep(100); await audit(cdp, viewport.id, 'damage-healing', 'partial-healing');
  }
  await cdp.send('Browser.close').catch(() => {}); cdp.close();
} finally {
  if (!browser.killed) browser.kill(); await sleep(250); await rm(profile, { recursive: true, force: true }).catch(() => {});
}

const apiRequestRecords = requests.filter(request => new URL(request.url).pathname.startsWith('/api/'));
const apiRequests = apiRequestRecords.map(request => request.url);
const failures = audits.filter(item => item.bodyLength === 0 || item.overlay || item.overflow > 0 || !item.heading || item.fixtureLeak);
if (audits.filter(item => item.state === 'context').some(item => !item.contextRequired || item.rosterReady || item.throughputReady)) failures.push({ reason: 'context gate is not explicit' });
if (audits.filter(item => item.surface === 'composition' && item.state === 'ready').some(item => !item.rosterReady || !item.partialVisible)) failures.push({ reason: 'Composition ready/partial state incomplete' });
if (audits.filter(item => item.surface === 'damage-healing' && item.state.startsWith('ready')).some(item => !item.throughputReady || !item.graphVisible)) failures.push({ reason: 'Damage & Healing ready graph state incomplete' });
if (audits.filter(item => item.state === 'ready-healing').some(item => !item.healingSelected)) failures.push({ reason: 'Healing toggle interaction failed' });
if (audits.filter(item => item.state === 'partial-healing').some(item => !item.partialVisible || !item.graphUnavailable || !item.healingSelected)) failures.push({ reason: 'Damage & Healing partial graph state incomplete' });
if (apiRequests.length !== 10 || apiRequests.some(url => !/[?&]report=SANITIZED01/.test(url) || !/[?&]encounter=3010/.test(url) || !/[?&]difficulty=5/.test(url))) failures.push({ reason: 'API requests are not exact-scope and deterministic', apiRequests });
const externalRequestRecords = requests.filter(request => new URL(request.url).origin !== baseOrigin);
for (const surface of ['composition', 'damage-healing']) {
  const report = {
    schemaVersion: 'phase4-visual-v1', surface, fixture: 'sanitized WCL-shaped local response; external traffic blocked before dispatch', baseUrl,
    audits: audits.filter(item => item.surface === surface), errors,
    apiRequests: apiRequestRecords.filter(request => request.surface === surface).map(request => request.url),
    externalRequestsBlocked: externalRequestRecords.filter(request => request.surface === surface).map(request => request.url),
  };
  await writeFile(join(output, surface, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
if (errors.length || failures.length) { console.error(JSON.stringify({ errors, apiRequests, failures }, null, 2)); process.exit(1); }
console.log(`[visual] PASS - ${audits.length} route/viewport checks - 0 browser errors - 10 exact-scope stubbed API requests - 0 provider calls`);
