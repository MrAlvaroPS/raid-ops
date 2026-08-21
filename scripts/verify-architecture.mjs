import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const root = fileURLToPath(new URL('../src/app/', import.meta.url));
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) files.push(path);
  }
}

await walk(root);
const failures = [];

for (const file of files) {
  const name = relative(root, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');
  const pureLayer = name.includes('/domain/') || name.includes('/application/');
  if (pureLayer && /from ['"](?:@angular|rxjs)/.test(source)) {
    failures.push(`${name}: domain/application cannot depend on Angular or RxJS`);
  }
  if (pureLayer && /from ['"][^'"]*(?:infrastructure|presentation)[^'"]*['"]/.test(source)) {
    failures.push(`${name}: dependency direction points toward infrastructure/presentation`);
  }
  if (name.includes('/infrastructure/') && /from ['"][^'"]*presentation[^'"]*['"]/.test(source)) {
    failures.push(`${name}: infrastructure cannot depend on presentation`);
  }
  if (
    /@Component\s*\(/.test(source) &&
    !name.includes('/presentation/') &&
    !name.startsWith('shell/') &&
    name !== 'app.ts'
  ) {
    failures.push(`${name}: Angular components belong in presentation or shell`);
  }
}

const catalog = await readFile(
  new URL('../src/app/features/migration-control/domain/feature-catalog.ts', import.meta.url),
  'utf8',
);
const angularOwners = [...catalog.matchAll(/\{([\s\S]*?)\},/g)]
  .filter((match) => /owner:\s*'angular'/.test(match[1]))
  .map((match) => match[1].match(/id:\s*'([^']+)'/)?.[1])
  .filter(Boolean);
const expectedAngularOwners = [
  'progress',
  'pull-lab',
  'damage-healing',
  'defensive-audit',
  'players',
  'composition',
];
if (
  angularOwners.length !== expectedAngularOwners.length ||
  angularOwners.some((owner, index) => owner !== expectedAngularOwners[index])
) {
  failures.push(
    `incremental ownership must contain only Defensive Audit, Players, Progress, Pull Lab, Damage & Healing and Composition; found: ${angularOwners.join(', ') || 'none'}`,
  );
}
const routes = await readFile(new URL('../src/app/app.routes.ts', import.meta.url), 'utf8');
if (
  !routes.includes("case 'progress'") ||
  !routes.includes('features/progress/presentation/progress-page')
) {
  failures.push('Progress must resolve to its Angular presentation route');
}
if (
  !routes.includes("case 'composition'") ||
  !routes.includes('features/composition/presentation/composition-page')
) {
  failures.push('Composition must resolve to its Angular presentation route');
}
if (
  !routes.includes("case 'damage-healing'") ||
  !routes.includes('features/damage-healing/presentation/damage-healing-page')
) {
  failures.push('Damage & Healing must resolve to its Angular presentation route');
}
if (
  !routes.includes("case 'pull-lab'") ||
  !routes.includes('features/pull-lab/presentation/pull-lab-page')
) {
  failures.push('Pull Lab must resolve to its Angular presentation route');
}
if (
  !routes.includes("case 'players'") ||
  !routes.includes('features/players/presentation/players-page')
) {
  failures.push('Players must resolve to its Angular presentation route');
}
if (
  !routes.includes("case 'defensive-audit'") ||
  !routes.includes('features/defensive-audit/presentation/defensive-audit-page')
) {
  failures.push('Defensive Audit must resolve to its Angular presentation route');
}
const compositionRepository = await readFile(
  new URL(
    '../src/app/features/composition/infrastructure/composition-api.repository.ts',
    import.meta.url,
  ),
  'utf8',
);
for (const parameter of ['report', 'encounter', 'difficulty']) {
  if (!compositionRepository.includes(`${parameter}:`))
    failures.push(`Composition request must include explicit ${parameter}`);
}
const damageHealingRepository = await readFile(
  new URL(
    '../src/app/features/damage-healing/infrastructure/damage-healing-api.repository.ts',
    import.meta.url,
  ),
  'utf8',
);
for (const parameter of ['report', 'encounter', 'difficulty']) {
  if (!damageHealingRepository.includes(`${parameter}:`))
    failures.push(`Damage & Healing requests must include explicit ${parameter}`);
}
for (const endpoint of ['/api/wcl/report?', '/api/wcl/telemetry?']) {
  if (!damageHealingRepository.includes(endpoint))
    failures.push(`Damage & Healing must reuse existing ${endpoint} read`);
}
const pullLabRepository = await readFile(
  new URL(
    '../src/app/features/pull-lab/infrastructure/pull-lab-api.repository.ts',
    import.meta.url,
  ),
  'utf8',
);
for (const parameter of ['report', 'encounter', 'difficulty']) {
  if (!pullLabRepository.includes(`${parameter}:`))
    failures.push(`Pull Lab request must include explicit ${parameter}`);
}
if (!pullLabRepository.includes('/api/wcl/operational-execution?'))
  failures.push('Pull Lab must reuse the existing operational-execution read');
const progressRepository = await readFile(
  new URL(
    '../src/app/features/progress/infrastructure/progress-api.repository.ts',
    import.meta.url,
  ),
  'utf8',
);
if (!progressRepository.includes("'/api/wcl/home-history'"))
  failures.push('Progress must discover scopes from persisted HOME history');
for (const parameter of ['encounter', 'difficulty']) {
  if (!progressRepository.includes(`${parameter}:`))
    failures.push(`Progress request must include explicit ${parameter}`);
}
if (/report:/.test(progressRepository))
  failures.push('Progress must not scope longitudinal history to Active Report');
const playersRepository = await readFile(
  new URL('../src/app/features/players/infrastructure/players-api.repository.ts', import.meta.url),
  'utf8',
);
for (const parameter of ['report', 'encounter', 'difficulty']) {
  if (!playersRepository.includes(`${parameter}:`))
    failures.push(`Players report reads must include explicit ${parameter}`);
}
for (const endpoint of [
  '/api/wcl/telemetry?',
  '/api/wcl/intelligence?',
  '/api/wcl/home-history?',
]) {
  if (!playersRepository.includes(endpoint))
    failures.push(`Players must use the existing ${endpoint} boundary`);
}
if (
  !playersRepository.includes('historyQuery') ||
  /historyQuery[^\n]+report/.test(playersRepository)
)
  failures.push(
    'Players longitudinal attendance must remain HOME encounter+difficulty scoped, not Active Report scoped',
  );
const defensiveAuditRepository = await readFile(
  new URL(
    '../src/app/features/defensive-audit/infrastructure/defensive-audit-api.repository.ts',
    import.meta.url,
  ),
  'utf8',
);
for (const parameter of ['report', 'encounter', 'difficulty']) {
  if (!defensiveAuditRepository.includes(`${parameter}:`))
    failures.push(`Defensive Audit request must include explicit ${parameter}`);
}
if (!defensiveAuditRepository.includes('/api/wcl/operational-execution?'))
  failures.push('Defensive Audit must reuse the existing operational-execution boundary');
const defensiveAuditContract = await readFile(
  new URL(
    '../src/app/features/defensive-audit/infrastructure/defensive-audit-api.contract.ts',
    import.meta.url,
  ),
  'utf8',
);
for (const invariant of [
  "preventability: 'not-assessed'",
  "defensiveAvailability: 'unknown'",
  "inventoryAvailability: 'unknown'",
  "causality: 'probable-temporal-association-only'",
]) {
  if (!defensiveAuditContract.includes(invariant))
    failures.push(`Defensive Audit evidence invariant is missing: ${invariant}`);
}
const runtime = await readFile(
  new URL('../src/app/core/config/runtime-config.ts', import.meta.url),
  'utf8',
);
if (!/productionSwitchEnabled:\s*false/.test(runtime))
  failures.push('global production switch must remain statically false');

if (failures.length) {
  for (const failure of failures) console.error(`[architecture] ${failure}`);
  process.exit(1);
}

console.log(
  `[architecture] PASS · ${files.length} source files · dependency direction and six-surface incremental ownership preserved`,
);
