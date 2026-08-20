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
    if (entry.isDirectory()) files.push(...await walk(path));
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
  'docs/migration/baseline/CURRENT-ARCHITECTURE-BASELINE.md',
  'docs/migration/baseline/DATA-PERSISTENCE-BASELINE.md',
  'docs/visual/LIVING-VISUAL-BASELINE.md',
  'docs/visual/LEGACY-VISUAL-BASELINE.md',
  'docs/migration/evidence/release-history.json',
  'docs/migration/evidence/visual/offline/manifest.json',
];

for (const name of required) {
  if (!await exists(join(root, name))) failures.push(`missing required document: ${name}`);
}

const documentationFiles = await walk(join(root, 'docs'));
const activeChangelogs = documentationFiles.filter(path => /(?:CHANGELOG|(?:^|-)CHANGES)\.md$/i.test(basename(path)));
if (activeChangelogs.length !== 1 || relative(root, activeChangelogs[0]).replaceAll('\\', '/') !== 'docs/releases/CHANGELOG.md') {
  failures.push(`expected one Angular-owned changelog, found: ${activeChangelogs.map(path => relative(root, path)).join(', ')}`);
}

for (const markdownPath of documentationFiles.filter(path => path.endsWith('.md'))) {
  const source = await readFile(markdownPath, 'utf8');
  for (const match of source.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].trim();
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    const fileTarget = target.split('#', 1)[0];
    if (fileTarget && !await exists(resolve(dirname(markdownPath), fileTarget))) {
      failures.push(`broken documentation link in ${relative(root, markdownPath)}: ${target}`);
    }
  }
}

const changelog = await readFile(join(root, 'docs/releases/CHANGELOG.md'), 'utf8');
const history = JSON.parse(await readFile(join(root, 'docs/migration/evidence/release-history.json'), 'utf8'));
const allReleases = [...history.documentedPreGit, ...history.mainlineProductReleases];
for (const version of allReleases) {
  if (!changelog.includes(`v${version}`)) failures.push(`changelog omits audited version v${version}`);
}
if (new Set(allReleases).size !== allReleases.length) failures.push('release audit contains duplicate versions');
if (history.source.tags !== 0) failures.push('release audit unexpectedly claims Git tags');
if (history.packageVersionRule !== '0.3.9-<integer>-vercel.0') failures.push('package overlay rule drifted');
for (const version of history.documentedPreGit) {
  if (!history.evidence?.documentedPreGit?.[version]) failures.push(`pre-Git version lacks source document: v${version}`);
}
for (const version of history.mainlineProductReleases) {
  const evidence = history.evidence?.repositoryHistory?.[version];
  if (!evidence?.commit || !evidence?.class) failures.push(`repository version lacks commit/class evidence: v${version}`);
}

const parity = await readFile(join(root, 'docs/migration/PARITY-MATRIX.md'), 'utf8');
const requiredSurfaces = [
  'Command Center', 'LIVE', 'Progress', 'Pull Lab', 'Damage & Healing',
  'Mechanics', 'Defensive Audit', 'Players', 'Composition', 'Loot', 'Data & Logs',
];
for (const surface of requiredSurfaces) {
  if (!parity.includes(surface)) failures.push(`parity matrix omits ${surface}`);
}

const manifestPath = join(root, 'docs/migration/evidence/visual/offline/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.captures?.length !== 20) failures.push(`expected 20 legacy captures, found ${manifest.captures?.length ?? 0}`);
for (const capture of manifest.captures ?? []) {
  const localPath = join(root, 'docs/migration/evidence/visual/offline', capture.viewport, basename(capture.file));
  if (!await exists(localPath)) {
    failures.push(`missing visual evidence: ${localPath}`);
    continue;
  }
  const bytes = await readFile(localPath);
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== capture.sha256) failures.push(`visual evidence hash mismatch: ${basename(localPath)}`);
}

if (failures.length) {
  failures.forEach(failure => console.error(`[docs] ${failure}`));
  process.exit(1);
}

console.log(`[docs] PASS · ${allReleases.length} audited versions · ${manifest.captures.length} visual captures · 11 parity surfaces`);
