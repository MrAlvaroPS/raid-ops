export interface AbsoluteStage {
  readonly absoluteStageIndex: number;
  readonly semanticPhaseId: number | null;
  readonly startTime: number | null;
  readonly endTime: number | null;
  readonly inferred: boolean;
}

export interface StageBand {
  readonly absoluteStageIndex: number;
  readonly semanticPhaseId: number | null;
  readonly leftPct: number;
  readonly widthPct: number;
  readonly inferred: boolean;
}

export function absoluteStageBands(
  stages: readonly AbsoluteStage[],
  durationMs: number,
): readonly StageBand[] {
  const measured = stages.filter((stage) => stage.startTime != null && stage.endTime != null);
  if (!measured.length || durationMs <= 0) return [];
  const origin = measured[0].startTime as number;
  return measured.map((stage) => {
    const start = Math.max(0, (stage.startTime as number) - origin);
    const end = Math.max(start, (stage.endTime as number) - origin);
    return {
      absoluteStageIndex: stage.absoluteStageIndex,
      semanticPhaseId: stage.semanticPhaseId,
      leftPct: Math.min(100, (start * 100) / durationMs),
      widthPct: Math.min(100, Math.max(0, ((end - start) * 100) / durationMs)),
      inferred: stage.inferred,
    };
  });
}
