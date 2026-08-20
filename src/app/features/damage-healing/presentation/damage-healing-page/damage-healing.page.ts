import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiContractError } from '../../../../core/http/api-contract';
import { LegacyApiError } from '../../../../core/http/legacy-api-client';
import { WclScopeFormComponent } from '../../../../shared/presentation/wcl-scope-form/wcl-scope-form.component';
import { parseWclScope } from '../../../../shared/domain/wcl-scope';
import { LoadDamageHealing } from '../../application/load-damage-healing';
import { DamageHealingScope, DamageHealingSnapshot, StageThroughput, ThroughputMode } from '../../domain/damage-healing.models';
import { relativeStageWidth, stageMetric } from '../../domain/damage-healing.rules';
import { DAMAGE_HEALING_PROVIDERS, DAMAGE_HEALING_REPOSITORY } from '../../infrastructure/damage-healing-api.repository';
import { ThroughputChartComponent } from '../throughput-chart/throughput-chart.component';

type PageState =
  | { readonly kind: 'context-required' }
  | { readonly kind: 'loading'; readonly scope: DamageHealingScope }
  | { readonly kind: 'ready'; readonly scope: DamageHealingScope; readonly data: DamageHealingSnapshot }
  | { readonly kind: 'empty'; readonly scope: DamageHealingScope; readonly data: DamageHealingSnapshot }
  | { readonly kind: 'error'; readonly scope: DamageHealingScope; readonly message: string; readonly retryable: boolean };

@Component({
  selector: 'app-damage-healing-page',
  imports: [WclScopeFormComponent, ThroughputChartComponent],
  providers: DAMAGE_HEALING_PROVIDERS,
  templateUrl: './damage-healing.page.html',
  styleUrl: './damage-healing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DamageHealingPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loader = new LoadDamageHealing(inject(DAMAGE_HEALING_REPOSITORY));
  private requestSequence = 0;

  protected readonly currentScope = signal<DamageHealingScope | null>(null);
  protected readonly state = signal<PageState>({ kind: 'context-required' });
  protected readonly mode = signal<ThroughputMode>('damage');
  protected readonly data = computed(() => {
    const state = this.state();
    return state.kind === 'ready' || state.kind === 'empty' ? state.data : null;
  });
  protected readonly currentGraph = computed(() => this.data()?.graphs[this.mode()] ?? null);
  protected readonly stageValues = computed(() => (this.data()?.stages ?? []).map(stage => stageMetric(stage, this.mode())));

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const scope = parseWclScope(params.get('report'), params.get('encounter'), params.get('difficulty'));
      if (!scope) {
        this.currentScope.set(null);
        this.state.set({ kind: 'context-required' });
        return;
      }
      this.currentScope.set(scope);
      void this.load(scope);
    });
  }

  protected applyScope(scope: DamageHealingScope): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { report: scope.reportCode, encounter: scope.encounterId, difficulty: scope.difficulty },
    });
  }

  protected setMode(mode: ThroughputMode): void {
    this.mode.set(mode);
  }

  protected retry(): void {
    const state = this.state();
    if ('scope' in state) void this.load(state.scope);
  }

  protected stageValue(stage: StageThroughput): number | null {
    return stageMetric(stage, this.mode());
  }

  protected stageWidth(stage: StageThroughput): number {
    return relativeStageWidth(this.stageValue(stage), this.stageValues());
  }

  protected compact(value: number | null, decimals = 1): string {
    if (value == null || !Number.isFinite(value)) return '—';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`;
    return value.toLocaleString('en-US', { maximumFractionDigits: decimals });
  }

  protected percentage(value: number | null): string {
    return value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(1)}%`;
  }

  protected bossProgress(value: number | null | undefined): string {
    if (value == null) return '—';
    return value === 0 ? 'KILL' : `${value.toFixed(1)}%`;
  }

  protected modeUnit(): 'DPS' | 'HPS' {
    return this.mode() === 'damage' ? 'DPS' : 'HPS';
  }

  private async load(scope: DamageHealingScope): Promise<void> {
    const request = ++this.requestSequence;
    this.state.set({ kind: 'loading', scope });
    try {
      const data = await this.loader.execute(scope);
      if (request !== this.requestSequence) return;
      this.state.set({ kind: data.status === 'ready' ? 'ready' : 'empty', scope, data });
    } catch (error) {
      if (request !== this.requestSequence) return;
      const contractError = error instanceof ApiContractError;
      this.state.set({
        kind: 'error', scope,
        message: contractError
          ? 'The server responses did not satisfy the Damage & Healing evidence contract.'
          : error instanceof Error ? error.message : 'Damage & Healing could not be loaded.',
        retryable: error instanceof LegacyApiError ? error.retryable : !contractError,
      });
    }
  }
}
