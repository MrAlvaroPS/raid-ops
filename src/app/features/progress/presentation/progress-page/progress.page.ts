import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiContractError } from '../../../../core/http/api-contract';
import { LegacyApiError } from '../../../../core/http/legacy-api-client';
import { LoadProgress } from '../../application/load-progress';
import {
  ProgressHistoryIndex,
  ProgressRange,
  ProgressScope,
  ProgressSnapshot,
} from '../../domain/progress.models';
import {
  measuredBestForNight,
  parseProgressScope,
  progressChartSeries,
  progressValue,
  stageReachForNight,
  summarizeProgressDepth,
} from '../../domain/progress.rules';
import {
  PROGRESS_PROVIDERS,
  PROGRESS_REPOSITORY,
} from '../../infrastructure/progress-api.repository';
import { ProgressChartComponent } from '../progress-chart/progress-chart.component';

type PageState =
  | { readonly kind: 'index-loading' }
  | { readonly kind: 'history-empty'; readonly index: ProgressHistoryIndex }
  | {
      readonly kind: 'scope-loading';
      readonly index: ProgressHistoryIndex;
      readonly scope: ProgressScope;
    }
  | {
      readonly kind: 'ready' | 'empty' | 'blocked';
      readonly index: ProgressHistoryIndex;
      readonly scope: ProgressScope;
      readonly data: ProgressSnapshot;
    }
  | {
      readonly kind: 'error';
      readonly phase: 'index' | 'scope';
      readonly index: ProgressHistoryIndex | null;
      readonly scope: ProgressScope | null;
      readonly message: string;
      readonly retryable: boolean;
    };

@Component({
  selector: 'app-progress-page',
  imports: [ProgressChartComponent],
  providers: PROGRESS_PROVIDERS,
  templateUrl: './progress.page.html',
  styleUrl: './progress.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loader = new LoadProgress(inject(PROGRESS_REPOSITORY));
  private requestedScope: ProgressScope | null = null;
  private scopeSequence = 0;

  protected readonly state = signal<PageState>({ kind: 'index-loading' });
  protected readonly range = signal<ProgressRange>('all');
  protected readonly data = computed(() => {
    const state = this.state();
    return state.kind === 'ready' || state.kind === 'empty' || state.kind === 'blocked'
      ? state.data
      : null;
  });
  protected readonly model = computed(() => this.data()?.model ?? null);
  protected readonly depth = computed(() =>
    this.data()?.model ? summarizeProgressDepth(this.data()!.pulls, this.data()!.model!) : null,
  );
  protected readonly chart = computed(() =>
    progressChartSeries(this.data()?.pulls ?? [], this.range()),
  );
  protected readonly latestNights = computed(() => this.model()?.nights.slice(-4) ?? []);
  protected readonly stages = computed(() =>
    Array.from({ length: this.model()?.matrix.deepestStage ?? 0 }, (_, index) => index + 1),
  );
  protected readonly bestMeasured = computed(() => {
    const rows = this.depth()?.measured ?? [];
    return rows.length ? [...rows].sort((a, b) => progressValue(a)! - progressValue(b)!)[0] : null;
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.requestedScope = parseProgressScope(params.get('encounter'), params.get('difficulty'));
      const state = this.state();
      const index = 'index' in state ? state.index : null;
      if (index) void this.resolveScope(index);
    });
    void this.loadIndex();
  }

  protected selectScope(event: Event): void {
    const key = (event.target as HTMLSelectElement).value;
    const state = this.state();
    const index = 'index' in state ? state.index : null;
    const option = index?.scopes.find((scope) => scope.scopeKey === key);
    if (!option) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        encounter: option.encounterId,
        difficulty: option.difficulty,
        report: null,
        pull: null,
        pullA: null,
        pullB: null,
      },
    });
  }

  protected setRange(range: ProgressRange): void {
    this.range.set(range);
  }
  protected rangeDisabled(range: Exclude<ProgressRange, 'all'>): boolean {
    return Number(range) >= (this.data()?.pulls.length ?? 0);
  }
  protected retry(): void {
    const state = this.state();
    if (state.kind !== 'error') return;
    if (state.phase === 'index') void this.loadIndex();
    else if (state.index && state.scope) void this.loadScope(state.index, state.scope);
  }

  protected signalLabel(): string {
    const model = this.model();
    if (!model) return 'NO STRATEGIC SIGNAL';
    const candidate = model.candidateState ?? model.state,
      stage = model.block.deepestStage,
      rate = Math.round(model.block.currentStageConversionPct ?? 0);
    const labels: Record<string, string> = {
      cleared: 'BOSS CLEARED',
      breakthrough: 'YES — RECENT BREAKTHROUGH',
      stabilizing: `YES — S${stage} IS STABILIZING`,
      converting: `YES — S${stage} IS BECOMING MORE REPEATABLE`,
      improving: 'YES — CURRENT FORM IS IMPROVING',
      plateau: 'PROGRESS HAS PLATEAUED',
      regressing: 'CURRENT FORM IS REGRESSING',
      learning: `S${stage} IS STILL BEING LEARNED`,
      baseline: 'BUILDING A BASELINE',
    };
    return labels[candidate.key] ?? candidate.label;
  }
  protected signalDetail(): string {
    return (
      this.model()?.candidateState.detail ??
      this.model()?.state.detail ??
      'No strategic signal available.'
    );
  }
  protected signalTone(): string {
    return this.model()?.candidateState.tone ?? this.model()?.state.tone ?? '';
  }
  protected qualityLabel(): string {
    const grade = this.model()?.dataQuality.grade;
    return grade === 'BLOCKED'
      ? 'DATA INTEGRITY BLOCKED'
      : this.depth()?.limited
        ? 'DEPTH DATA LIMITED'
        : grade === 'PARTIAL'
          ? 'PARTIAL DEPTH DATA'
          : 'DATA QUALITY GOOD';
  }
  protected percentage(value: number | null, decimals = 1): string {
    return value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(decimals)}%`;
  }
  protected pp(value: number | null): string {
    return value == null || !Number.isFinite(value)
      ? '—'
      : `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}pp`;
  }
  protected date(value: number | null): string {
    return value == null
      ? '—'
      : new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit' })
          .format(value)
          .toUpperCase();
  }
  protected stageReach(sessionId: string): number | null {
    return stageReachForNight(
      this.data()?.pulls ?? [],
      sessionId,
      this.model()?.block.deepestStage ?? 1,
    );
  }
  protected measuredBest(sessionId: string): number | null {
    return measuredBestForNight(this.data()?.pulls ?? [], sessionId);
  }
  protected measuredCount(sessionId: string): number {
    return (this.data()?.pulls ?? []).filter(
      (pull) =>
        pull.sessionId === sessionId &&
        pull.progressMetricEligible &&
        (pull.kill || (pull.fightPercentage != null && pull.fightPercentage < 99.999)),
    ).length;
  }
  protected cellClass(rate: number | null): string {
    const value = rate ?? 0;
    return value >= 80
      ? 'full'
      : value >= 60
        ? 'high'
        : value >= 35
          ? 'mid'
          : value > 0
            ? 'low'
            : 'none';
  }
  protected recordNumber(record: Record<string, unknown>, key: string): number | null {
    const value = Number(record[key]);
    return Number.isFinite(value) ? value : null;
  }
  protected recordBoolean(record: Record<string, unknown>, key: string): boolean {
    return record[key] === true;
  }
  protected durationMinutes(value: number | null): string {
    if (value == null || !Number.isFinite(value)) return '—';
    return value < 60
      ? `${Math.round(value)} min`
      : `${Math.floor(value / 60)}h ${Math.round(value % 60)}m`;
  }
  protected invariantEntries(): readonly [string, boolean][] {
    return Object.entries(this.model()?.diagnostics.invariants ?? {});
  }

  private async loadIndex(): Promise<void> {
    this.state.set({ kind: 'index-loading' });
    try {
      const index = await this.loader.index();
      await this.resolveScope(index);
    } catch (error) {
      this.setError('index', null, null, error);
    }
  }

  private async resolveScope(index: ProgressHistoryIndex): Promise<void> {
    if (!index.scopes.length) {
      this.state.set({ kind: 'history-empty', index });
      return;
    }
    const scope =
      this.requestedScope &&
      index.scopes.some((item) => item.scopeKey === this.requestedScope!.scopeKey)
        ? this.requestedScope
        : index.scopes[0];
    if (!this.requestedScope || this.requestedScope.scopeKey !== scope.scopeKey) {
      this.requestedScope = scope;
      await this.router.navigate([], {
        relativeTo: this.route,
        replaceUrl: true,
        queryParams: {
          encounter: scope.encounterId,
          difficulty: scope.difficulty,
          report: null,
          pull: null,
          pullA: null,
          pullB: null,
        },
      });
      await this.loadScope(index, scope);
      return;
    }
    const state = this.state();
    if (
      (state.kind === 'ready' || state.kind === 'empty' || state.kind === 'blocked') &&
      state.scope.scopeKey === scope.scopeKey
    )
      return;
    await this.loadScope(index, scope);
  }

  private async loadScope(index: ProgressHistoryIndex, scope: ProgressScope): Promise<void> {
    const request = ++this.scopeSequence;
    this.range.set('all');
    this.state.set({ kind: 'scope-loading', index, scope });
    try {
      const data = await this.loader.scope(scope);
      if (request === this.scopeSequence) this.state.set({ kind: data.status, index, scope, data });
    } catch (error) {
      if (request === this.scopeSequence) this.setError('scope', index, scope, error);
    }
  }

  private setError(
    phase: 'index' | 'scope',
    index: ProgressHistoryIndex | null,
    scope: ProgressScope | null,
    error: unknown,
  ): void {
    const contract = error instanceof ApiContractError;
    this.state.set({
      kind: 'error',
      phase,
      index,
      scope,
      message: contract
        ? 'The server response did not satisfy the persisted HOME Progress contract.'
        : error instanceof Error
          ? error.message
          : 'Progress could not be loaded.',
      retryable: error instanceof LegacyApiError ? error.retryable : !contract,
    });
  }
}
