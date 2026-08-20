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
if (/owner:\s*'angular'/.test(catalog)) failures.push('Phase 3 cannot claim Angular ownership of a product surface');
const runtime = await readFile(new URL('../src/app/core/config/runtime-config.ts', import.meta.url), 'utf8');
if (!/productionSwitchEnabled:\s*false/.test(runtime)) failures.push('Phase 3 production switch must remain statically false');

if (failures.length) {
  for (const failure of failures) console.error(`[architecture] ${failure}`);
  process.exit(1);
}

console.log(`[architecture] PASS · ${files.length} source files · dependency direction and legacy ownership preserved`);
