import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiContractError } from '../../../../core/http/api-contract';
import { LegacyApiError } from '../../../../core/http/legacy-api-client';
import { parseWclScope } from '../../../../shared/domain/wcl-scope';
import { WclScopeFormComponent } from '../../../../shared/presentation/wcl-scope-form/wcl-scope-form.component';
import { LoadCommandCenter } from '../../application/load-command-center';
import {
  CommandCenterPull,
  CommandCenterScope,
  CommandCenterSignal,
  CommandCenterSnapshot,
} from '../../domain/command-center.models';
import { chartPoints, deepestStage, stageReach } from '../../domain/command-center.rules';
import {
  COMMAND_CENTER_PROVIDERS,
  COMMAND_CENTER_REPOSITORY,
} from '../../infrastructure/command-center-api.repository';

type PageState =
  | { readonly kind: 'context-required' }
  | { readonly kind: 'loading'; readonly scope: CommandCenterScope }
  | {
      readonly kind: 'ready' | 'empty';
      readonly scope: CommandCenterScope;
      readonly data: CommandCenterSnapshot;
    }
  | {
      readonly kind: 'error';
      readonly scope: CommandCenterScope;
      readonly message: string;
      readonly retryable: boolean;
    };

@Component({
  selector: 'app-command-center-page',
  imports: [RouterLink, WclScopeFormComponent],
  providers: COMMAND_CENTER_PROVIDERS,
  templateUrl: './command-center.page.html',
  styleUrl: './command-center.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandCenterPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loader = new LoadCommandCenter(inject(COMMAND_CENTER_REPOSITORY));
  private requestSequence = 0;

  protected readonly state = signal<PageState>({ kind: 'context-required' });
  protected readonly data = computed(() => {
    const state = this.state();
    return state.kind === 'ready' || state.kind === 'empty' ? state.data : null;
  });
  protected readonly points = computed(() => chartPoints(this.data()?.pulls ?? []));
  protected readonly stages = computed(() => {
    const maximum = deepestStage(this.data()?.pulls ?? []);
    return Array.from({ length: maximum }, (_, index) =>
      stageReach(this.data()?.pulls ?? [], index + 1),
    );
  });
  protected readonly improvements = computed(
    () => this.data()?.comparison?.signals.filter((signal) => signal.status === 'improved') ?? [],
  );
  protected readonly regressions = computed(
    () => this.data()?.comparison?.signals.filter((signal) => signal.status === 'regressed') ?? [],
  );
  protected readonly scopeQuery = computed(() => {
    const state = this.state();
    if (!('scope' in state)) return {};
    return {
      report: state.scope.reportCode,
      encounter: state.scope.encounterId,
      difficulty: state.scope.difficulty,
    };
  });
  protected readonly progressQuery = computed(() => {
    const state = this.state();
    if (!('scope' in state)) return {};
    return { encounter: state.scope.encounterId, difficulty: state.scope.difficulty };
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const scope = parseWclScope(
        params.get('report'),
        params.get('encounter'),
        params.get('difficulty'),
      );
      if (!scope) {
        this.state.set({ kind: 'context-required' });
        return;
      }
      void this.load(scope);
    });
  }

  protected applyScope(scope: CommandCenterScope): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        report: scope.reportCode,
        encounter: scope.encounterId,
        difficulty: scope.difficulty,
      },
    });
  }

  protected retry(): void {
    const state = this.state();
    if ('scope' in state) void this.load(state.scope);
  }

  protected percent(value: number | null, digits = 1): string {
    return value == null ? '—' : `${value.toFixed(digits)}%`;
  }

  protected compact(value: number | null): string {
    if (value == null) return '—';
    return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
      value,
    );
  }

  protected snapshotTime(value: number): string {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(value);
  }

  protected chartX(index: number, total: number): number {
    return total <= 1 ? 50 : (index * 100) / (total - 1);
  }

  protected chartY(pull: CommandCenterPull): number {
    return pull.kill ? 0 : Math.max(0, Math.min(100, pull.fightPercentage ?? 100));
  }

  protected signalValue(signal: CommandCenterSignal, side: 'current' | 'baseline'): string {
    const value = signal[side];
    if (value == null) return '—';
    if (signal.unit === 'pp') return `${value.toFixed(1)}%`;
    if (signal.unit === 'dps') return this.compact(value);
    return Math.round(value).toLocaleString('en-US');
  }

  private async load(scope: CommandCenterScope): Promise<void> {
    const request = ++this.requestSequence;
    this.state.set({ kind: 'loading', scope });
    try {
      const data = await this.loader.execute(scope);
      if (request !== this.requestSequence) return;
      this.state.set({ kind: data.status, scope, data });
    } catch (error) {
      if (request !== this.requestSequence) return;
      const contractError = error instanceof ApiContractError;
      this.state.set({
        kind: 'error',
        scope,
        message: contractError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Command Center could not be loaded.',
        retryable: !contractError && (!(error instanceof LegacyApiError) || error.retryable),
      });
    }
  }
}
