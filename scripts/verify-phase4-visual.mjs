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
const pullFact = ({ fightId, pullNumber, fightPercentage, durationMs, stageCount, raidDps, raidHps, firstDeathMs, meaningfulDeaths, rosterFingerprint = '1-2-3-4' }) => ({
  fightId, pullNumber, kill: fightPercentage === 0, fightPercentage, bossPercentage: fightPercentage, durationMs, stageCount,
  stages: stages.slice(0, stageCount).map((stage, index) => ({ ...stage, endTime: Math.min(stage.endTime, 1_000 + durationMs), absoluteStageIndex: index + 1 })),
  raidDps, raidHps, firstDeathMs, firstDeath: firstDeathMs == null ? null : { fightId, actorId: 1, player: 'Aster', fightRelativeMs: firstDeathMs, abilityId: 100, killingBlow: 'Sanitized impact', overkill: 100 },
  rawDeaths: firstDeathMs == null ? 0 : meaningfulDeaths + 1, meaningfulDeaths,
  rawDeathTimeline: firstDeathMs == null ? [] : [
    { fightId, actorId: 1, player: 'Aster', fightRelativeMs: firstDeathMs, abilityId: 100, killingBlow: 'Sanitized impact', overkill: 100 },
    { fightId, actorId: 3, player: 'Cinder', fightRelativeMs: Math.min(durationMs - 1_000, firstDeathMs + 18_000), abilityId: 101, killingBlow: 'Sanitized follow-up', overkill: 50 },
  ],
  meaningfulDeathTimeline: firstDeathMs == null ? [] : [{ fightId, actorId: 1, player: 'Aster', fightRelativeMs: firstDeathMs, abilityId: 100, killingBlow: 'Sanitized impact', overkill: 100 }],
  rosterFingerprint, rosterSize: 4, analysisEligible: true,
});
const pullRows = [
  pullFact({ fightId: 75, pullNumber: 1, fightPercentage: 61.2, durationMs: 126_000, stageCount: 1, raidDps: 1_020_000, raidHps: 210_000, firstDeathMs: 74_000, meaningfulDeaths: 3 }),
  pullFact({ fightId: 76, pullNumber: 3, fightPercentage: 35.8, durationMs: 181_000, stageCount: 2, raidDps: 1_240_000, raidHps: 248_000, firstDeathMs: 119_000, meaningfulDeaths: 2 }),
  pullFact({ fightId: 77, pullNumber: 4, fightPercentage: 12.5, durationMs: 200_000, stageCount: 3, raidDps: 1_370_000, raidHps: 235_000, firstDeathMs: 164_000, meaningfulDeaths: 1, rosterFingerprint: '1-2-3-5' }),
];
const excludedPull = { fightId: 78, pullNumber: 2, durationMs: 11_000, fightPercentage: 99.2, bossPercentage: 99.2, stageCount: 1, firstDeathMs: null, classification: 'short-reset', reason: 'Pull ended before the analytical minimum.', reasons: ['duration-below-threshold'] };
const pullTelemetryFixture = {
  ...telemetryFixture,
  pullIntelligence: {
    pulls: pullRows, excludedPulls: [excludedPull], rawClosedPullCount: 4, analysisPullCount: 3,
    analysisPopulation: { rawPulls: 4, eligiblePulls: 3, excludedPulls: [excludedPull], eligibleFightIds: [75, 76, 77], policy: 'called-wipe/reset pulls remain in WCL history but are excluded from product analytics' },
    latest: pullRows[2], previous: pullRows[1], best: pullRows[2], status: 'ready',
  },
};
const operationalFixture = {
  ok: true, version: 'operational-execution-v1', generatedAt: 1787230800000, status: 'ready', report: { code: 'SANITIZED01' }, encounter,
  analysisPopulation: pullTelemetryFixture.pullIntelligence.analysisPopulation, telemetry: pullTelemetryFixture,
  mechanics: {
    observations: [
      { fightId: 76, key: 'sanitized-cast', name: 'Sanitized cast', occurrences: 2, occurrenceSource: 'cast', affectedPlayers: 0 },
      { fightId: 77, key: 'sanitized-wave', name: 'Sanitized wave', occurrences: 3, occurrenceSource: 'damage-window', affectedPlayers: 2 },
    ],
    failures: [{ fightId: 76, mechanicKey: 'sanitized-soak', mechanicName: 'Sanitized soak', actorId: 3, reason: 'Observed impact did not satisfy the active rule.' }],
  },
  dataCompleteness: { mechanicDamage: { events: 8, pages: 1, truncated: false }, assignmentAuras: { events: 4, truncated: false }, meaningfulDeaths: { events: 3, truncated: false } },
  evidenceContract: { ...evidenceContract, observedMechanicDoesNotImplyFailure: true },
};
const gatedOperationalFixture = { ...operationalFixture, status: 'boss-reference-not-ready', mechanics: null, evidenceContract: { sameDifficultyOnly: true, noUnrehearsedMechanicClassification: true } };
const insufficientPull = pullRows[0];
const insufficientOperationalFixture = {
  ...gatedOperationalFixture,
  telemetry: { ...pullTelemetryFixture, pullIntelligence: { pulls: [insufficientPull], excludedPulls: [], analysisPopulation: { rawPulls: 1, eligiblePulls: 1, excludedPulls: [], eligibleFightIds: [75], policy: 'called-wipe/reset pulls excluded' }, status: 'insufficient-data' } },
};
const progressEvidence = { source: 'persisted-home-history', homeOnly: true, activeReportDoesNotMutateHistory: true, difficultyClassifiedPerFight: true, crossDifficultyAggregationForbidden: true, readPathWclNetwork: false };
const progressIndexPulls = Array.from({ length: 8 }, (_, index) => ({ mode: 'single', key: `${index < 4 ? 'HOMEA' : 'HOMEB'}:${index + 1}`, reportCode: index < 4 ? 'HOMEA' : 'HOMEB', reportTitle: index < 4 ? 'Night one' : 'Night two', fightId: index + 1, pullNumber: index % 4 + 1, encounterId: 3010, bossName: 'Sanitized Encounter', difficulty: 5, difficultyName: 'Mythic', scopeKey: '3010:d5', kill: false, fightPercentage: 90 - index * 8, bossPercentage: 90 - index * 8, reportStartTime: index < 4 ? 1787144400000 : 1787230800000, fightStartTime: index % 4 * 180000, fightEndTime: index % 4 * 180000 + 120000 }));
const progressIndexFixture = { ok: true, version: 'avoid-history-read-v1', storeVersion: 'avoid-history-store-v1.2', status: 'ready', guildId: 1, zone: { id: 42, name: 'Sanitized Raid' }, syncedAt: 1787230800000, reportCount: 2, pullCount: 8, reports: [], pulls: [{ key: 'all', mode: 'all', label: 'All pulls' }, ...progressIndexPulls], networkExecuted: false, wclCallsExecuted: 0, needsRefresh: false, evidenceContract: progressEvidence };
const progressEmptyIndexFixture = { ...progressIndexFixture, status: 'empty', reportCount: 0, pullCount: 0, pulls: [{ key: 'all', mode: 'all', label: 'All pulls' }], needsRefresh: true };
const makeProgressPulls = limited => progressIndexPulls.map((row, index) => {
  const exact = limited ? [0, 1, 4, 5].includes(index) : index === 0;
  const fightPercentage = exact ? 100 : row.fightPercentage;
  return { pullNumber: index + 1, globalPullNumber: index + 1, sessionId: index < 4 ? 'night-1' : 'night-2', sessionIndex: index < 4 ? 1 : 2, sessionTitle: index < 4 ? 'Night one' : 'Night two', absoluteStartTime: row.reportStartTime + row.fightStartTime, absoluteEndTime: row.reportStartTime + row.fightEndTime, durationMs: 120000, kill: false, fightPercentage, bossPercentage: fightPercentage, stageCount: index < 3 ? 1 : index < 6 ? 2 : 3, progressMetricEligible: true, progressMetricReason: exact ? 'wcl-no-measurable-completion' : 'wcl-fight-percentage', progressMetricSeverity: exact ? 'review' : 'confirmed', progressMetricFlags: exact ? ['exact-100-fight-progress'] : [], reportCodes: [row.reportCode], fightIds: [row.fightId] };
});
const makeProgressModel = (pulls, grade = 'GOOD', blocked = false) => {
  const measured = pulls.filter(row => row.fightPercentage < 99.999).length;
  const nights = [0, 1].map(night => ({ sessionId: `night-${night + 1}`, sessionIndex: night + 1, startTime: pulls[night * 4].absoluteStartTime, endTime: pulls[night * 4 + 3].absoluteEndTime, title: `Night ${night + 1}`, pulls: 4, metricEligiblePulls: 4, metricExcludedPulls: 0, scoredPulls: 4, unscoredPulls: 0, kills: 0, bestFightPercentage: Math.min(...pulls.slice(night * 4, night * 4 + 4).map(row => row.fightPercentage)), medianFightPercentage: night ? 42 : 78, deepPullRatePct: night ? 75 : 25, medianDeltaPp: night ? 36 : null, firstGlobalPull: night * 4 + 1, lastGlobalPull: night * 4 + 4, sourceReports: 1 }));
  const auditRows = pulls.filter(row => row.progressMetricFlags.length).map(row => ({ globalPullNumber: row.pullNumber, sessionId: row.sessionId, sessionIndex: row.sessionIndex, reportCodes: row.reportCodes, fightIds: row.fightIds, durationMs: row.durationMs, fightPercentage: row.fightPercentage, bossPercentage: row.bossPercentage, stageCount: row.stageCount, kill: false, metricEligible: true, reason: row.progressMetricReason, severity: row.progressMetricSeverity, flags: row.progressMetricFlags }));
  const invariants = { nightRawPullsMatch: !blocked, nightEligiblePullsMatch: true, globalPullNumbersContiguous: true, eligiblePullsReferenceCanonical: true, currentFormUsesEligiblePopulation: true };
  return { modelVersion: 'progress-model-v2', metricsVersion: '2.0.0', eligibilityVersion: 'progress-metric-eligibility-v1', policy: { currentFormPulls: 20, previousFormPulls: 20, deepPullMarginPp: 10, breakthroughDepthPp: 2, retentionTolerancePp: 2, matrixWindowPulls: 20 }, totals: { pulls: 8, rawPulls: 8, metricEligiblePulls: 8, metricExcludedPulls: 0, scoredPulls: 8, nights: 2, kills: 0 }, block: { bestPct: 34, deepestStage: 3, currentDeepRatePct: 50, previousDeepRatePct: null, deepDeltaPp: null, currentMedianPct: 61, previousMedianPct: null, consistencyGapPp: 27, previousConsistencyGapPp: null, consistencyGapImprovementPp: null, currentStageConversionPct: 25, previousStageConversionPct: null, stageConversionDeltaPp: null, currentBlock: { metricEligiblePulls: 8 }, previousBlock: { metricEligiblePulls: 0 } }, breakthrough: { latest: { pullNumber: 8, reasons: ['stage 3', '8.0pp depth'] }, pullsSince: 0, nightsSince: 0, count: 4 }, candidateState: { key: 'baseline', label: 'BUILDING BASELINE', tone: '', detail: '8/20 metric-eligible CURRENT FORM pulls available' }, state: blocked ? { key: 'data-review', label: 'DATA REVIEW', tone: 'warn', detail: 'Canonical invariant failed' } : { key: 'baseline', label: 'BUILDING BASELINE', tone: '', detail: '8/20 metric-eligible CURRENT FORM pulls available' }, nights, health: { phaseConversionPct: 25, phaseConversionDeltaPp: null, retention: { available: false, reason: 'insufficient-eligible-pulls' }, throughput: { available: true, current: { pulls: 4, activeMinutes: 11, pullsPerHour: 21.8, medianDowntimeMinutes: 1 }, previous: { pulls: 4, activeMinutes: 11, pullsPerHour: 21.8, medianDowntimeMinutes: 1 }, deltaPullsPerHour: 0 } }, matrix: { deepestStage: 3, windowSize: 20, maxPulls: 160, population: 'metric-eligible-pulls', windows: [{ eligibleFirst: 1, eligibleLast: 8, firstGlobalPull: 1, lastGlobalPull: 8, pulls: 8, complete: false, stages: [{ stage: 1, hit: 8, pulls: 8, ratePct: 100 }, { stage: 2, hit: 5, pulls: 8, ratePct: 62.5 }, { stage: 3, hit: 2, pulls: 8, ratePct: 25 }] }] }, dataQuality: { version: 'progress-data-quality-v1', grade: blocked ? 'BLOCKED' : grade, holdStrategicState: blocked || grade === 'REVIEW', rawPulls: 8, metricEligiblePulls: 8, metricExcludedPulls: 0, eligibleCoveragePct: 100, reviewFlaggedPulls: auditRows.length, exactHundredPulls: auditRows.length, exactHundredSharePct: auditRows.length * 12.5, contradictoryPulls: 0, notes: auditRows.length ? [`${auditRows.length}/8 raw pulls have exact 100.0% WCL fight progress.`] : [], auditRows }, diagnostics: { rawNightTotal: 8, eligibleNightTotal: 8, canonicalPullTotal: 8, metricEligiblePullTotal: 8, invariants } };
};
const makeProgressScope = (mode = 'ready') => { const limited = mode === 'limited'; const pulls = makeProgressPulls(limited); return { ...progressIndexFixture, encounter: { id: 3010, name: 'Sanitized Encounter', difficulty: 5, difficultyName: 'Mythic', scopeKey: '3010:d5' }, progressionPulls: pulls, progressModel: makeProgressModel(pulls, limited ? 'REVIEW' : 'GOOD', mode === 'blocked'), nights: [], recentNights: [], currentNight: null, previousNight: null, delta: null, reportDiagnostics: [{ reportCode: 'HOMEA', difficulty: 5 }, { reportCode: 'HOMEB', difficulty: 5 }] }; };
const bodies = {
  report: Buffer.from(JSON.stringify(reportFixture)).toString('base64'),
  telemetry: Buffer.from(JSON.stringify(telemetryFixture)).toString('base64'),
  partialTelemetry: Buffer.from(JSON.stringify(partialTelemetryFixture)).toString('base64'),
  operational: Buffer.from(JSON.stringify(operationalFixture)).toString('base64'),
  gatedOperational: Buffer.from(JSON.stringify(gatedOperationalFixture)).toString('base64'),
  insufficientOperational: Buffer.from(JSON.stringify(insufficientOperationalFixture)).toString('base64'),
  progressIndex: Buffer.from(JSON.stringify(progressIndexFixture)).toString('base64'),
  progressEmptyIndex: Buffer.from(JSON.stringify(progressEmptyIndexFixture)).toString('base64'),
  progressReady: Buffer.from(JSON.stringify(makeProgressScope('ready'))).toString('base64'),
  progressLimited: Buffer.from(JSON.stringify(makeProgressScope('limited'))).toString('base64'),
  progressBlocked: Buffer.from(JSON.stringify(makeProgressScope('blocked'))).toString('base64'),
};
let partialMode = false;
let pullMode = 'ready';
let progressMode = 'ready';
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
  pullMode = path.includes('visual=gated') ? 'gated' : path.includes('visual=insufficient') ? 'insufficient' : 'ready';
  progressMode = path.includes('visual=empty') ? 'empty' : path.includes('visual=limited') ? 'limited' : path.includes('visual=blocked') ? 'blocked' : 'ready';
  currentSurface = path.startsWith('/composition') ? 'composition' : path.startsWith('/damage-healing') ? 'damage-healing' : path.startsWith('/pull-lab') ? 'pull-lab' : path.startsWith('/progress') ? 'progress' : 'unknown';
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
    pullReady: document.body?.innerText?.includes('Pull comparator') || false,
    pullSelected: document.querySelectorAll('.selectors select').length === 2 && document.querySelectorAll('.selectors select')[0]?.value !== document.querySelectorAll('.selectors select')[1]?.value,
    mechanicsGated: document.body?.innerText?.includes('CLASSIFICATION GATED') || false,
    insufficientData: document.body?.innerText?.includes('One eligible pull is not a comparison') || false,
    partialVisible: document.body?.innerText?.includes('PARTIAL EVIDENCE') || false,
    graphVisible: Boolean(document.querySelector('app-throughput-chart svg polyline')),
    graphUnavailable: document.body?.innerText?.includes('GRAPH UNAVAILABLE') || false,
    healingSelected: document.querySelector('.mode-toggle button[aria-pressed="true"]')?.textContent?.trim() === 'Healing',
    progressReady: document.body?.innerText?.includes('All-pull progression') && Boolean(document.querySelector('app-progress-chart svg .best')),
    progressLimited: document.body?.innerText?.includes('DEPTH DATA LIMITED') && document.body?.innerText?.includes('DEPTH COVERAGE'),
    progressEmpty: document.body?.innerText?.includes('HOME HISTORY EMPTY') || false,
    progressBlocked: document.body?.innerText?.includes('Strategic Progress indicators are withheld') || false,
    progressScopeVisible: document.body?.innerText?.includes('HOME PROGRESSION SCOPE') || false,
    progressReportParam: location.pathname === '/progress' && location.search.includes('report='),
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
    if (pathname === '/api/wcl/report' || pathname === '/api/wcl/telemetry' || pathname === '/api/wcl/operational-execution') {
      const body = pathname.endsWith('/report') ? bodies.report : pathname.endsWith('/telemetry') ? (partialMode ? bodies.partialTelemetry : bodies.telemetry) : pullMode === 'gated' ? bodies.gatedOperational : pullMode === 'insufficient' ? bodies.insufficientOperational : bodies.operational;
      void cdp.send('Fetch.fulfillRequest', { requestId: message.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body });
    } else if (pathname === '/api/wcl/home-history') {
      const scoped = url.searchParams.has('encounter') || url.searchParams.has('difficulty');
      const body = !scoped ? (progressMode === 'empty' ? bodies.progressEmptyIndex : bodies.progressIndex) : progressMode === 'limited' ? bodies.progressLimited : progressMode === 'blocked' ? bodies.progressBlocked : bodies.progressReady;
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
    await navigate(cdp, '/pull-lab', 'CONTEXT REQUIRED'); await audit(cdp, viewport.id, 'pull-lab', 'context');
    await navigate(cdp, '/pull-lab?report=SANITIZED01&encounter=3010&difficulty=5', 'Pull comparator'); await audit(cdp, viewport.id, 'pull-lab', 'ready');
    await evaluate(cdp, `(() => { const select = document.querySelectorAll('.selectors select')[1]; select.value = '75'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`); await sleep(150); await audit(cdp, viewport.id, 'pull-lab', 'selected');
    await navigate(cdp, '/pull-lab?report=SANITIZED01&encounter=3010&difficulty=5&visual=gated', 'CLASSIFICATION GATED'); await audit(cdp, viewport.id, 'pull-lab', 'mechanics-gated');
    await navigate(cdp, '/pull-lab?report=SANITIZED01&encounter=3010&difficulty=5&visual=insufficient', 'One eligible pull is not a comparison'); await audit(cdp, viewport.id, 'pull-lab', 'insufficient');
    await navigate(cdp, '/progress?visual=empty', 'HOME HISTORY EMPTY'); await audit(cdp, viewport.id, 'progress', 'history-empty');
    await navigate(cdp, '/progress', 'All-pull progression'); await audit(cdp, viewport.id, 'progress', 'ready');
    await navigate(cdp, '/progress?visual=limited', 'DEPTH DATA LIMITED'); await audit(cdp, viewport.id, 'progress', 'limited');
    await navigate(cdp, '/progress?visual=blocked', 'Strategic Progress indicators are withheld'); await audit(cdp, viewport.id, 'progress', 'blocked');
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
if (audits.filter(item => item.surface === 'pull-lab' && (item.state === 'ready' || item.state === 'selected')).some(item => !item.pullReady || !item.pullSelected)) failures.push({ reason: 'Pull Lab comparison/selection state incomplete' });
if (audits.filter(item => item.state === 'mechanics-gated').some(item => !item.pullReady || !item.mechanicsGated)) failures.push({ reason: 'Pull Lab gated mechanics state incomplete' });
if (audits.filter(item => item.state === 'insufficient').some(item => !item.insufficientData || item.pullReady)) failures.push({ reason: 'Pull Lab insufficient-data state incomplete' });
if (audits.filter(item => item.surface === 'progress' && item.state === 'ready').some(item => !item.progressReady || !item.progressScopeVisible || item.progressReportParam)) failures.push({ reason: 'Progress ready state or HOME scope isolation incomplete' });
if (audits.filter(item => item.state === 'limited').some(item => !item.progressReady || !item.progressLimited)) failures.push({ reason: 'Progress limited-depth state incomplete' });
if (audits.filter(item => item.state === 'history-empty').some(item => !item.progressEmpty || item.progressScopeVisible)) failures.push({ reason: 'Progress empty HOME history state incomplete' });
if (audits.filter(item => item.state === 'blocked').some(item => !item.progressBlocked || !item.progressScopeVisible || item.progressReady)) failures.push({ reason: 'Progress blocked invariant state leaks strategic indicators' });
const nonProgressApi = apiRequestRecords.filter(request => request.surface !== 'progress').map(request => request.url);
if (nonProgressApi.length !== 16 || nonProgressApi.some(url => !/[?&]report=SANITIZED01/.test(url) || !/[?&]encounter=3010/.test(url) || !/[?&]difficulty=5/.test(url))) failures.push({ reason: 'Report-scoped API requests are not exact and deterministic', apiRequests: nonProgressApi });
const progressApi = apiRequestRecords.filter(request => request.surface === 'progress').map(request => request.url);
if (progressApi.length !== 14 || progressApi.some(url => /[?&]report=/.test(url)) || progressApi.filter(url => new URL(url).searchParams.has('encounter')).some(url => !/[?&]encounter=3010/.test(url) || !/[?&]difficulty=5/.test(url))) failures.push({ reason: 'Progress requests are not deterministic persisted HOME reads', apiRequests: progressApi });
const externalRequestRecords = requests.filter(request => new URL(request.url).origin !== baseOrigin);
for (const surface of ['composition', 'damage-healing', 'pull-lab', 'progress']) {
  const report = {
    schemaVersion: 'phase4-visual-v1', surface, fixture: 'sanitized WCL-shaped local response; external traffic blocked before dispatch', baseUrl,
    audits: audits.filter(item => item.surface === surface), errors,
    apiRequests: apiRequestRecords.filter(request => request.surface === surface).map(request => request.url),
    externalRequestsBlocked: externalRequestRecords.filter(request => request.surface === surface).map(request => request.url),
  };
  await writeFile(join(output, surface, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
if (errors.length || failures.length) { console.error(JSON.stringify({ errors, apiRequests, failures }, null, 2)); process.exit(1); }
console.log(`[visual] PASS - ${audits.length} route/viewport checks - 0 browser errors - 30 stubbed local API reads - 0 provider calls`);
