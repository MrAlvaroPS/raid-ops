import { access, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, dirname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const failures = [];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

const required = [
  'docs/README.md',
  'docs/releases/CHANGELOG.md',
  'docs/releases/RELEASE-PROVENANCE.md',
  'docs/governance/DOCUMENTATION-OWNERSHIP.md',
  'docs/governance/MIGRATION-DEFINITION-OF-DONE.md',
  'docs/migration/README.md',
  'docs/migration/PARITY-MATRIX.md',
  'docs/migration/PHASE-0.md',
  'docs/migration/PHASE-1.md',
  'docs/migration/PHASE-2.md',
  'docs/migration/PHASE-3.md',
  'docs/migration/PHASE-4.md',
  'docs/features/composition/README.md',
  'docs/features/damage-healing/README.md',
  'docs/features/pull-lab/README.md',
  'docs/features/progress/README.md',
  'docs/features/players/README.md',
  'docs/features/defensive-audit/README.md',
  'docs/features/command-center/README.md',
  'docs/migration/baseline/CURRENT-ARCHITECTURE-BASELINE.md',
  'docs/migration/baseline/DATA-PERSISTENCE-BASELINE.md',
  'docs/visual/LIVING-VISUAL-BASELINE.md',
  'docs/visual/LEGACY-VISUAL-BASELINE.md',
  'docs/migration/evidence/release-history.json',
  'docs/migration/evidence/phase3-verification.json',
  'docs/migration/evidence/phase4-composition-verification.json',
  'docs/migration/evidence/phase4-damage-healing-verification.json',
  'docs/migration/evidence/phase4-pull-lab-verification.json',
  'docs/migration/evidence/phase4-progress-verification.json',
  'docs/migration/evidence/phase4-players-verification.json',
  'docs/migration/evidence/phase4-defensive-audit-verification.json',
  'docs/migration/evidence/phase4-command-center-verification.json',
  'docs/migration/evidence/visual/offline/manifest.json',
];

for (const name of required) {
  if (!(await exists(join(root, name)))) failures.push(`missing required document: ${name}`);
}

const documentationFiles = await walk(join(root, 'docs'));
const activeChangelogs = documentationFiles.filter((path) =>
  /(?:CHANGELOG|(?:^|-)CHANGES)\.md$/i.test(basename(path)),
);
if (
  activeChangelogs.length !== 1 ||
  relative(root, activeChangelogs[0]).replaceAll('\\', '/') !== 'docs/releases/CHANGELOG.md'
) {
  failures.push(
    `expected one Angular-owned changelog, found: ${activeChangelogs.map((path) => relative(root, path)).join(', ')}`,
  );
}

for (const markdownPath of documentationFiles.filter((path) => path.endsWith('.md'))) {
  const source = await readFile(markdownPath, 'utf8');
  for (const match of source.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].trim();
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    const fileTarget = target.split('#', 1)[0];
    if (fileTarget && !(await exists(resolve(dirname(markdownPath), fileTarget)))) {
      failures.push(`broken documentation link in ${relative(root, markdownPath)}: ${target}`);
    }
  }
}

const changelog = await readFile(join(root, 'docs/releases/CHANGELOG.md'), 'utf8');
const history = JSON.parse(
  await readFile(join(root, 'docs/migration/evidence/release-history.json'), 'utf8'),
);
const phase3 = JSON.parse(
  await readFile(join(root, 'docs/migration/evidence/phase3-verification.json'), 'utf8'),
);
const phase4 = JSON.parse(
  await readFile(
    join(root, 'docs/migration/evidence/phase4-composition-verification.json'),
    'utf8',
  ),
);
const damageHealing = JSON.parse(
  await readFile(
    join(root, 'docs/migration/evidence/phase4-damage-healing-verification.json'),
    'utf8',
  ),
);
const pullLab = JSON.parse(
  await readFile(join(root, 'docs/migration/evidence/phase4-pull-lab-verification.json'), 'utf8'),
);
const progress = JSON.parse(
  await readFile(join(root, 'docs/migration/evidence/phase4-progress-verification.json'), 'utf8'),
);
const players = JSON.parse(
  await readFile(join(root, 'docs/migration/evidence/phase4-players-verification.json'), 'utf8'),
);
const defensiveAudit = JSON.parse(
  await readFile(
    join(root, 'docs/migration/evidence/phase4-defensive-audit-verification.json'),
    'utf8',
  ),
);
const commandCenter = JSON.parse(
  await readFile(
    join(root, 'docs/migration/evidence/phase4-command-center-verification.json'),
    'utf8',
  ),
);
const allReleases = [...history.documentedPreGit, ...history.mainlineProductReleases];
for (const version of allReleases) {
  if (!changelog.includes(`v${version}`))
    failures.push(`changelog omits audited version v${version}`);
}
if (new Set(allReleases).size !== allReleases.length)
  failures.push('release audit contains duplicate versions');
if (history.source.tags !== 0) failures.push('release audit unexpectedly claims Git tags');
if (history.packageVersionRule !== '0.3.9-<integer>-vercel.0')
  failures.push('package overlay rule drifted');
for (const version of history.documentedPreGit) {
  if (!history.evidence?.documentedPreGit?.[version])
    failures.push(`pre-Git version lacks source document: v${version}`);
}
for (const version of history.mainlineProductReleases) {
  const evidence = history.evidence?.repositoryHistory?.[version];
  if (!evidence?.commit || !evidence?.class)
    failures.push(`repository version lacks commit/class evidence: v${version}`);
}
if (phase3.results?.auditedReleaseVersions !== allReleases.length)
  failures.push('Phase 3 evidence has stale release-audit count');
if (phase3.results?.legacyVisualCapturesTransferred !== 20)
  failures.push('Phase 3 evidence has stale visual-transfer count');
if (phase3.results?.canonicalChangelog !== 'docs/releases/CHANGELOG.md')
  failures.push('Phase 3 evidence points at the wrong changelog');
if (phase3.legacyBaseline?.documentationHandoffCommit !== 'c300993')
  failures.push('Phase 3 evidence omits the legacy hand-off commit');
if (phase4.surface !== 'composition' || phase4.frontendOwner !== 'angular')
  failures.push('Phase 4 evidence does not transfer Composition ownership');
if (phase4.productionSwitchEnabled !== false)
  failures.push('Phase 4 evidence must keep the global production switch disabled');
if (phase4.results?.wclProviderCalls !== 0 || phase4.results?.databaseOrCorpusMutations !== 0)
  failures.push('Phase 4 visual evidence must remain provider- and mutation-free');
if (
  phase4.scopeContract?.identity !== 'encounter+difficulty' ||
  phase4.scopeContract?.crossDifficultyComparisonForbidden !== true
)
  failures.push('Phase 4 evidence lost difficulty isolation');
if (phase4.visualEvidence?.captures?.length !== 4)
  failures.push('Phase 4 evidence must contain four Composition captures');
for (const capture of phase4.visualEvidence?.captures ?? []) {
  const path = join(root, 'docs/migration/evidence/visual/composition', capture.file);
  if (!(await exists(path))) {
    failures.push(`missing Composition visual evidence: ${capture.file}`);
    continue;
  }
  const digest = createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
  if (digest !== capture.sha256)
    failures.push(`Composition visual evidence hash mismatch: ${capture.file}`);
}
if (damageHealing.surface !== 'damage-healing' || damageHealing.frontendOwner !== 'angular')
  failures.push('Phase 4 evidence does not transfer Damage & Healing ownership');
if (damageHealing.productionSwitchEnabled !== false)
  failures.push('Damage & Healing evidence must keep the global production switch disabled');
if (
  damageHealing.results?.wclProviderCalls !== 0 ||
  damageHealing.results?.databaseOrCorpusMutations !== 0
)
  failures.push('Damage & Healing visual evidence must remain provider- and mutation-free');
if (
  damageHealing.scopeContract?.identity !== 'encounter+difficulty' ||
  damageHealing.scopeContract?.crossDifficultyComparisonForbidden !== true
)
  failures.push('Damage & Healing evidence lost difficulty isolation');
if (
  damageHealing.scopeContract?.phaseModel !== 'absolute-stage' ||
  damageHealing.metricContract?.version !== 'damage-healing-view-v1'
)
  failures.push('Damage & Healing evidence lost its stage/metric contract');
if (damageHealing.visualEvidence?.captures?.length !== 8)
  failures.push('Damage & Healing evidence must contain eight responsive state captures');
for (const capture of damageHealing.visualEvidence?.captures ?? []) {
  const path = join(root, 'docs/migration/evidence/visual/damage-healing', capture.file);
  if (!(await exists(path))) {
    failures.push(`missing Damage & Healing visual evidence: ${capture.file}`);
    continue;
  }
  const digest = createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
  if (digest !== capture.sha256)
    failures.push(`Damage & Healing visual evidence hash mismatch: ${capture.file}`);
}
if (pullLab.surface !== 'pull-lab' || pullLab.frontendOwner !== 'angular')
  failures.push('Phase 4 evidence does not transfer Pull Lab ownership');
if (pullLab.productionSwitchEnabled !== false)
  failures.push('Pull Lab evidence must keep the global production switch disabled');
if (pullLab.results?.wclProviderCalls !== 0 || pullLab.results?.databaseOrCorpusMutations !== 0)
  failures.push('Pull Lab visual evidence must remain provider- and mutation-free');
if (
  pullLab.scopeContract?.identity !== 'report+encounter+difficulty' ||
  pullLab.scopeContract?.crossDifficultyComparisonForbidden !== true
)
  failures.push('Pull Lab evidence lost exact scope isolation');
if (
  pullLab.scopeContract?.onePullPolicy !== 'insufficient-data' ||
  pullLab.metricContract?.version !== 'pull-lab-comparison-v1'
)
  failures.push('Pull Lab evidence lost its selection/metric contract');
if (
  pullLab.metricContract?.raidDpsDirection !== 'same absolute stage only' ||
  pullLab.metricContract?.raidHpsDirection !== 'observational'
)
  failures.push('Pull Lab evidence weakened throughput comparison semantics');
if (pullLab.visualEvidence?.captures?.length !== 10)
  failures.push('Pull Lab evidence must contain ten responsive state captures');
for (const capture of pullLab.visualEvidence?.captures ?? []) {
  const path = join(root, 'docs/migration/evidence/visual/pull-lab', capture.file);
  if (!(await exists(path))) {
    failures.push(`missing Pull Lab visual evidence: ${capture.file}`);
    continue;
  }
  const digest = createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
  if (digest !== capture.sha256)
    failures.push(`Pull Lab visual evidence hash mismatch: ${capture.file}`);
}
if (progress.surface !== 'progress' || progress.frontendOwner !== 'angular')
  failures.push('Phase 4 evidence does not transfer Progress ownership');
if (progress.productionSwitchEnabled !== false)
  failures.push('Progress evidence must keep the global production switch disabled');
if (progress.results?.wclProviderCalls !== 0 || progress.results?.databaseOrCorpusMutations !== 0)
  failures.push('Progress visual evidence must remain provider- and mutation-free');
if (
  progress.scopeContract?.identity !== 'HOME+raid+encounter+difficulty' ||
  progress.scopeContract?.activeReportIgnored !== true ||
  progress.scopeContract?.crossDifficultyAggregationForbidden !== true
)
  failures.push('Progress evidence lost HOME/difficulty isolation');
if (
  progress.metricContract?.modelVersion !== 'progress-model-v2' ||
  progress.metricContract?.metricsVersion !== '2.0.0' ||
  progress.metricContract?.chartRange !== 'raw chronological presentation only'
)
  failures.push('Progress evidence lost the active model/presentation contract');
if (progress.visualEvidence?.captures?.length !== 8)
  failures.push('Progress evidence must contain eight responsive state captures');
for (const capture of progress.visualEvidence?.captures ?? []) {
  const path = join(root, 'docs/migration/evidence/visual/progress', capture.file);
  if (!(await exists(path))) {
    failures.push(`missing Progress visual evidence: ${capture.file}`);
    continue;
  }
  const digest = createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
  if (digest !== capture.sha256)
    failures.push(`Progress visual evidence hash mismatch: ${capture.file}`);
}
if (players.surface !== 'players' || players.frontendOwner !== 'angular')
  failures.push('Phase 4 evidence does not transfer Players ownership');
if (players.productionSwitchEnabled !== false)
  failures.push('Players evidence must keep the global production switch disabled');
if (players.results?.wclProviderCalls !== 0 || players.results?.databaseOrCorpusMutations !== 0)
  failures.push('Players visual evidence must remain provider- and mutation-free');
if (
  players.scopeContract?.identity !== 'HOME+report+encounter+difficulty' ||
  players.scopeContract?.historyIdentity !== 'HOME+raid+encounter+difficulty' ||
  players.scopeContract?.crossDifficultyAggregationForbidden !== true
)
  failures.push('Players evidence lost HOME/report/difficulty isolation');
if (
  players.scopeContract?.attendanceJoin !== 'exact normalized realm+name only' ||
  players.scopeContract?.externalPlayersAdmitted !== false
)
  failures.push('Players evidence weakened identity or external-population isolation');
if (
  players.metricContract?.reliabilityModelVersion !== '1.1.0' ||
  players.metricContract?.publicationGate !==
    'status published + publication publishable + finite value' ||
  players.metricContract?.shadowValueDecoded !== false ||
  players.metricContract?.performanceOrParseIncluded !== false
)
  failures.push('Players evidence lost Reliability publication semantics');
if (players.visualEvidence?.captures?.length !== 10)
  failures.push('Players evidence must contain ten responsive state captures');
for (const capture of players.visualEvidence?.captures ?? []) {
  const path = join(root, 'docs/migration/evidence/visual/players', capture.file);
  if (!(await exists(path))) {
    failures.push(`missing Players visual evidence: ${capture.file}`);
    continue;
  }
  const digest = createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
  if (digest !== capture.sha256)
    failures.push(`Players visual evidence hash mismatch: ${capture.file}`);
}
if (defensiveAudit.surface !== 'defensive-audit' || defensiveAudit.frontendOwner !== 'angular')
  failures.push('Phase 4 evidence does not transfer Defensive Audit ownership');
if (defensiveAudit.productionSwitchEnabled !== false)
  failures.push('Defensive Audit evidence must keep the global production switch disabled');
if (
  defensiveAudit.results?.wclProviderCalls !== 0 ||
  defensiveAudit.results?.databaseOrCorpusMutations !== 0
)
  failures.push('Defensive Audit visual evidence must remain provider- and mutation-free');
if (
  defensiveAudit.scopeContract?.identity !== 'report+encounter+difficulty' ||
  defensiveAudit.scopeContract?.evidenceIdentity !== 'encounter+difficulty' ||
  defensiveAudit.scopeContract?.actorJoin !== 'numeric actor ID only' ||
  defensiveAudit.scopeContract?.crossDifficultyComparisonForbidden !== true ||
  defensiveAudit.scopeContract?.externalReportsPersistedAsHome !== false
)
  failures.push('Defensive Audit evidence lost exact scope, identity or external isolation');
if (
  defensiveAudit.metricContract?.version !== 'defensive-audit-observational-v1' ||
  defensiveAudit.metricContract?.causality !==
    'probable temporal association only; not causal proof' ||
  defensiveAudit.metricContract?.defensiveAvailability !== 'unknown' ||
  defensiveAudit.metricContract?.inventoryAvailability !== 'unknown' ||
  defensiveAudit.metricContract?.preventability !== 'not-assessed'
)
  failures.push('Defensive Audit evidence weakened causality, availability or null semantics');
if (
  defensiveAudit.operationalBoundary?.endpointMayAcquireWcl !== true ||
  defensiveAudit.operationalBoundary?.endpointMayPersistHomeOperationalProducts !== true ||
  defensiveAudit.operationalBoundary?.externalEvaluationNeverHome !== true ||
  defensiveAudit.operationalBoundary?.visualDispatch !== false
)
  failures.push('Defensive Audit evidence misstates the operational endpoint boundary');
if (defensiveAudit.visualEvidence?.captures?.length !== 10)
  failures.push('Defensive Audit evidence must contain ten responsive state captures');
for (const capture of defensiveAudit.visualEvidence?.captures ?? []) {
  const path = join(root, 'docs/migration/evidence/visual/defensive-audit', capture.file);
  if (!(await exists(path))) {
    failures.push(`missing Defensive Audit visual evidence: ${capture.file}`);
    continue;
  }
  const digest = createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
  if (digest !== capture.sha256)
    failures.push(`Defensive Audit visual evidence hash mismatch: ${capture.file}`);
}
if (commandCenter.surface !== 'command-center' || commandCenter.frontendOwner !== 'angular')
  failures.push('Phase 4 evidence does not transfer Command Center ownership');
if (commandCenter.productionSwitchEnabled !== false)
  failures.push('Command Center evidence must keep the global production switch disabled');
if (
  commandCenter.results?.wclProviderCalls !== 0 ||
  commandCenter.results?.databaseOrCorpusMutations !== 0
)
  failures.push('Command Center visual evidence must remain provider- and mutation-free');
if (
  commandCenter.scopeContract?.identity !== 'report+encounter+difficulty' ||
  commandCenter.scopeContract?.evidenceIdentity !== 'encounter+difficulty' ||
  commandCenter.scopeContract?.crossDifficultyComparisonForbidden !== true ||
  commandCenter.scopeContract?.activePullIsCompletedEvidence !== false ||
  commandCenter.scopeContract?.progressLinkCarriesReport !== false ||
  commandCenter.scopeContract?.externalReportsPersistedAsHome !== false
)
  failures.push('Command Center evidence lost scope, active-pull or HOME isolation');
if (
  commandCenter.metricContract?.version !== 'command-center-operational-overview-v1' ||
  commandCenter.metricContract?.refresh !== 'manual snapshot; no route polling' ||
  commandCenter.metricContract?.latestComparison !==
    'latest eligible pull versus previous eligible pull' ||
  commandCenter.metricContract?.raidDpsDirection !== 'same absolute stage only' ||
  commandCenter.metricContract?.rosterEffect !== 'not inferred' ||
  commandCenter.metricContract?.killReadiness !== 'not-assessed' ||
  commandCenter.metricContract?.blockerCausality !==
    'evidence-ranked association only; not causal proof'
)
  failures.push('Command Center evidence weakened freshness, readiness or causal semantics');
if (
  commandCenter.operationalBoundary?.endpointMayAcquireWcl !== true ||
  commandCenter.operationalBoundary?.endpointMayPersistHomeOperationalProducts !== true ||
  commandCenter.operationalBoundary?.externalEvaluationNeverHome !== true ||
  commandCenter.operationalBoundary?.routePollingAdded !== false ||
  commandCenter.operationalBoundary?.visualDispatch !== false
)
  failures.push('Command Center evidence misstates the operational endpoint boundary');
if (commandCenter.visualEvidence?.captures?.length !== 12)
  failures.push('Command Center evidence must contain twelve responsive state captures');
for (const capture of commandCenter.visualEvidence?.captures ?? []) {
  const path = join(root, 'docs/migration/evidence/visual/command-center', capture.file);
  if (!(await exists(path))) {
    failures.push(`missing Command Center visual evidence: ${capture.file}`);
    continue;
  }
  const digest = createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
  if (digest !== capture.sha256)
    failures.push(`Command Center visual evidence hash mismatch: ${capture.file}`);
}

const parity = await readFile(join(root, 'docs/migration/PARITY-MATRIX.md'), 'utf8');
const requiredSurfaces = [
  'Command Center',
  'LIVE',
  'Progress',
  'Pull Lab',
  'Damage & Healing',
  'Mechanics',
  'Defensive Audit',
  'Players',
  'Composition',
  'Loot',
  'Data & Logs',
];
for (const surface of requiredSurfaces) {
  if (!parity.includes(surface)) failures.push(`parity matrix omits ${surface}`);
}

const manifestPath = join(root, 'docs/migration/evidence/visual/offline/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.captures?.length !== 20)
  failures.push(`expected 20 legacy captures, found ${manifest.captures?.length ?? 0}`);
for (const capture of manifest.captures ?? []) {
  const localPath = join(
    root,
    'docs/migration/evidence/visual/offline',
    capture.viewport,
    basename(capture.file),
  );
  if (!(await exists(localPath))) {
    failures.push(`missing visual evidence: ${localPath}`);
    continue;
  }
  const bytes = await readFile(localPath);
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== capture.sha256)
    failures.push(`visual evidence hash mismatch: ${basename(localPath)}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`[docs] ${failure}`));
  process.exit(1);
}

console.log(
  `[docs] PASS · ${allReleases.length} audited versions · ${manifest.captures.length} legacy + ${phase4.visualEvidence.captures.length + damageHealing.visualEvidence.captures.length + pullLab.visualEvidence.captures.length + progress.visualEvidence.captures.length + players.visualEvidence.captures.length + defensiveAudit.visualEvidence.captures.length + commandCenter.visualEvidence.captures.length} Phase 4 captures · 11 parity surfaces`,
);
