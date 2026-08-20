export type WclDifficulty = 1 | 2 | 3 | 4 | 5;

export interface WclScope {
  readonly reportCode: string;
  readonly encounterId: number;
  readonly difficulty: WclDifficulty;
}

export const WCL_DIFFICULTIES: readonly { readonly id: WclDifficulty; readonly label: string }[] = Object.freeze([
  { id: 1, label: 'LFR' },
  { id: 2, label: 'Flexible' },
  { id: 3, label: 'Normal' },
  { id: 4, label: 'Heroic' },
  { id: 5, label: 'Mythic' },
]);

export function parseWclScope(report: string | null, encounter: string | null, difficulty: string | null): WclScope | null {
  const reportCode = report?.trim() ?? '';
  const encounterId = Number(encounter);
  const difficultyId = Number(difficulty);
  if (!/^[A-Za-z0-9]+$/.test(reportCode) || !Number.isInteger(encounterId) || encounterId <= 0 || ![1, 2, 3, 4, 5].includes(difficultyId)) return null;
  return { reportCode, encounterId, difficulty: difficultyId as WclDifficulty };
}
