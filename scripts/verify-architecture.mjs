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
  if (/@Component\s*\(/.test(source) && !name.includes('/presentation/') && !name.startsWith('shell/') && name !== 'app.ts') {
    failures.push(`${name}: Angular components belong in presentation or shell`);
  }
}

const catalog = await readFile(new URL('../src/app/features/migration-control/domain/feature-catalog.ts', import.meta.url), 'utf8');
const angularOwners = [...catalog.matchAll(/id:\s*'([^']+)'[^\n]+owner:\s*'angular'/g)].map(match => match[1]);
const expectedAngularOwners = ['damage-healing', 'composition'];
if (angularOwners.length !== expectedAngularOwners.length || angularOwners.some((owner, index) => owner !== expectedAngularOwners[index])) {
  failures.push(`incremental ownership must contain only Damage & Healing and Composition; found: ${angularOwners.join(', ') || 'none'}`);
}
const routes = await readFile(new URL('../src/app/app.routes.ts', import.meta.url), 'utf8');
if (!routes.includes("case 'composition'") || !routes.includes("features/composition/presentation/composition-page")) {
  failures.push('Composition must resolve to its Angular presentation route');
}
if (!routes.includes("case 'damage-healing'") || !routes.includes("features/damage-healing/presentation/damage-healing-page")) {
  failures.push('Damage & Healing must resolve to its Angular presentation route');
}
const compositionRepository = await readFile(new URL('../src/app/features/composition/infrastructure/composition-api.repository.ts', import.meta.url), 'utf8');
for (const parameter of ['report', 'encounter', 'difficulty']) {
  if (!compositionRepository.includes(`${parameter}:`)) failures.push(`Composition request must include explicit ${parameter}`);
}
const damageHealingRepository = await readFile(new URL('../src/app/features/damage-healing/infrastructure/damage-healing-api.repository.ts', import.meta.url), 'utf8');
for (const parameter of ['report', 'encounter', 'difficulty']) {
  if (!damageHealingRepository.includes(`${parameter}:`)) failures.push(`Damage & Healing requests must include explicit ${parameter}`);
}
for (const endpoint of ['/api/wcl/report?', '/api/wcl/telemetry?']) {
  if (!damageHealingRepository.includes(endpoint)) failures.push(`Damage & Healing must reuse existing ${endpoint} read`);
}
const runtime = await readFile(new URL('../src/app/core/config/runtime-config.ts', import.meta.url), 'utf8');
if (!/productionSwitchEnabled:\s*false/.test(runtime)) failures.push('global production switch must remain statically false');

if (failures.length) {
  for (const failure of failures) console.error(`[architecture] ${failure}`);
  process.exit(1);
}

console.log(`[architecture] PASS · ${files.length} source files · dependency direction and two-surface incremental ownership preserved`);
