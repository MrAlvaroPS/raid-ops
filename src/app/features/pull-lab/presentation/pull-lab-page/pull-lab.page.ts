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
import { parseWclScope } from '../../../../shared/domain/wcl-scope';
import { WclScopeFormComponent } from '../../../../shared/presentation/wcl-scope-form/wcl-scope-form.component';
import { LoadPullLab } from '../../application/load-pull-lab';
import {
  MechanicFailure,
  MechanicObservation,
  PullComparisonSignal,
  PullFact,
  PullLabScope,
  PullLabSnapshot,
} from '../../domain/pull-lab.models';
import { comparePulls, deathPosition, isMeaningfulDeath } from '../../domain/pull-lab.rules';
import {
  PULL_LAB_PROVIDERS,
  PULL_LAB_REPOSITORY,
} from '../../infrastructure/pull-lab-api.repository';

type PageState =
  | { readonly kind: 'context-required' }
  | { readonly kind: 'loading'; readonly scope: PullLabScope }
  | {
      readonly kind: 'ready' | 'insufficient-data' | 'empty';
      readonly scope: PullLabScope;
      readonly data: PullLabSnapshot;
    }
  | {
      readonly kind: 'error';
      readonly scope: PullLabScope;
      readonly message: string;
      readonly retryable: boolean;
    };

@Component({
  selector: 'app-pull-lab-page',
  imports: [WclScopeFormComponent],
  providers: PULL_LAB_PROVIDERS,
  templateUrl: './pull-lab.page.html',
  styleUrl: './pull-lab.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PullLabPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loader = new LoadPullLab(inject(PULL_LAB_REPOSITORY));
  private requestSequence = 0;
  private requestedPullA: number | null = null;
  private requestedPullB: number | null = null;

  protected readonly currentScope = signal<PullLabScope | null>(null);
  protected readonly state = signal<PageState>({ kind: 'context-required' });
  protected readonly selectedPullA = signal<number | null>(null);
  protected readonly selectedPullB = signal<number | null>(null);
  protected readonly data = computed(() => {
    const state = this.state();
    return state.kind === 'ready' || state.kind === 'insufficient-data' || state.kind === 'empty'
      ? state.data
      : null;
  });
  protected readonly pullA = computed(
    () => this.data()?.pulls.find((pull) => pull.fightId === this.selectedPullA()) ?? null,
  );
  protected readonly pullB = computed(
    () => this.data()?.pulls.find((pull) => pull.fightId === this.selectedPullB()) ?? null,
  );
  protected readonly comparison = computed(() =>
    this.pullA() && this.pullB() ? comparePulls(this.pullA()!, this.pullB()!) : null,
  );

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const scope = parseWclScope(
        params.get('report'),
        params.get('encounter'),
        params.get('difficulty'),
      );
      this.requestedPullA = this.parseFightId(params.get('pullA'));
      this.requestedPullB = this.parseFightId(params.get('pullB'));
      if (!scope) {
        this.currentScope.set(null);
        this.state.set({ kind: 'context-required' });
        return;
      }
      const current = this.currentScope();
      this.currentScope.set(scope);
      if (
        current &&
        current.reportCode === scope.reportCode &&
        current.encounterId === scope.encounterId &&
        current.difficulty === scope.difficulty &&
        this.data()
      ) {
        this.resolveSelection(this.data()!);
      } else {
        void this.load(scope);
      }
    });
  }

  protected applyScope(scope: PullLabScope): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        report: scope.reportCode,
        encounter: scope.encounterId,
        difficulty: scope.difficulty,
        pullA: null,
        pullB: null,
      },
    });
  }

  protected selectPull(side: 'A' | 'B', event: Event): void {
    const fightId = Number((event.target as HTMLSelectElement).value);
    if (!Number.isInteger(fightId)) return;
    const queryParams = side === 'A' ? { pullA: fightId } : { pullB: fightId };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected retry(): void {
    const state = this.state();
    if ('scope' in state) void this.load(state.scope);
  }

  protected mechanicsFor(pull: PullFact): {
    observations: readonly MechanicObservation[];
    failures: readonly MechanicFailure[];
  } {
    return {
      observations:
        this.data()?.mechanics.observations.filter((row) => row.fightId === pull.fightId) ?? [],
      failures: this.data()?.mechanics.failures.filter((row) => row.fightId === pull.fightId) ?? [],
    };
  }

  protected deathLeft(death: PullFact['rawDeathTimeline'][number], pull: PullFact): number {
    return deathPosition(death, pull.durationMs) ?? 0;
  }

  protected meaningful(death: PullFact['rawDeathTimeline'][number], pull: PullFact): boolean {
    return isMeaningfulDeath(death, pull.meaningfulDeathTimeline);
  }

  protected deathLabel(death: PullFact['rawDeathTimeline'][number]): string {
    return `${death.player ?? `Actor ${death.actorId ?? '?'}`} at ${this.duration(death.fightRelativeMs)}`;
  }

  protected progress(value: number | null): string {
    if (value == null) return '—';
    return value === 0 ? 'KILL' : `${value.toFixed(1)}%`;
  }

  protected duration(value: number | null): string {
    if (value == null) return 'NO DEATH';
    const seconds = Math.max(0, Math.round(value / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  protected compact(value: number | null): string {
    if (value == null) return '—';
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(Math.abs(value) < 10 ? 1 : 0);
  }

  protected signalValue(value: number | null, signal: PullComparisonSignal): string {
    if (signal.key === 'firstDeath') return value == null ? 'NO DEATH' : this.duration(value);
    if (signal.unit === 'ms') return this.duration(value);
    if (signal.unit === 'pp') return this.progress(value);
    if (signal.unit === 'dps' || signal.unit === 'hps') return this.compact(value);
    return value == null ? '—' : String(value);
  }

  protected statusLabel(signal: PullComparisonSignal): string {
    return signal.status === 'observed' ? 'OBSERVED' : signal.status.toUpperCase();
  }

  protected trackPull(_: number, pull: PullFact): number {
    return pull.fightId;
  }

  private resolveSelection(data: PullLabSnapshot): void {
    const pulls = data.pulls;
    if (pulls.length < 2) {
      this.selectedPullA.set(pulls.at(-1)?.fightId ?? null);
      this.selectedPullB.set(null);
      return;
    }
    const valid = (id: number | null) =>
      id != null && pulls.some((pull) => pull.fightId === id) ? id : null;
    const pullA = valid(this.requestedPullA) ?? pulls.at(-1)!.fightId;
    let pullB: number | null = valid(this.requestedPullB) ?? pulls.slice(0, -1).at(-1)!.fightId;
    if (pullB === pullA) pullB = pulls.find((pull) => pull.fightId !== pullA)?.fightId ?? null;
    this.selectedPullA.set(pullA);
    this.selectedPullB.set(pullB);
  }

  private parseFightId(value: string | null): number | null {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private async load(scope: PullLabScope): Promise<void> {
    const request = ++this.requestSequence;
    this.state.set({ kind: 'loading', scope });
    try {
      const data = await this.loader.execute(scope);
      if (request !== this.requestSequence) return;
      this.resolveSelection(data);
      this.state.set({ kind: data.status, scope, data });
    } catch (error) {
      if (request !== this.requestSequence) return;
      const contractError = error instanceof ApiContractError;
      this.state.set({
        kind: 'error',
        scope,
        message: contractError
          ? 'The server response did not satisfy the Pull Lab evidence contract.'
          : error instanceof Error
            ? error.message
            : 'Pull Lab could not be loaded.',
        retryable: error instanceof LegacyApiError ? error.retryable : !contractError,
      });
    }
  }
}
