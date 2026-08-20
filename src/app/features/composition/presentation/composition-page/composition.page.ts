import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiContractError } from '../../../../core/http/api-contract';
import { LegacyApiError } from '../../../../core/http/legacy-api-client';
import { LoadComposition } from '../../application/load-composition';
import { CompositionPlayer, CompositionScope, CompositionSnapshot } from '../../domain/composition.models';
import { WOW_CLASSES, cleanTalentName, classKey, playersByClass, summarizeComposition } from '../../domain/composition.rules';
import { COMPOSITION_PROVIDERS, COMPOSITION_REPOSITORY } from '../../infrastructure/composition-api.repository';
import { parseWclScope } from '../../../../shared/domain/wcl-scope';
import { WclScopeFormComponent } from '../../../../shared/presentation/wcl-scope-form/wcl-scope-form.component';

type PageState =
  | { readonly kind: 'context-required' }
  | { readonly kind: 'loading'; readonly scope: CompositionScope }
  | { readonly kind: 'ready'; readonly scope: CompositionScope; readonly data: CompositionSnapshot }
  | { readonly kind: 'empty'; readonly scope: CompositionScope; readonly data: CompositionSnapshot }
  | { readonly kind: 'error'; readonly scope: CompositionScope; readonly message: string; readonly retryable: boolean };

@Component({
  selector: 'app-composition-page',
  imports: [WclScopeFormComponent],
  providers: COMPOSITION_PROVIDERS,
  templateUrl: './composition.page.html',
  styleUrl: './composition.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompositionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loader = new LoadComposition(inject(COMPOSITION_REPOSITORY));
  private requestSequence = 0;

  protected readonly currentScope = signal<CompositionScope | null>(null);
  protected readonly state = signal<PageState>({ kind: 'context-required' });
  protected readonly data = computed(() => {
    const state = this.state();
    return state.kind === 'ready' || state.kind === 'empty' ? state.data : null;
  });
  protected readonly summary = computed(() => summarizeComposition(this.data()?.players ?? []));
  protected readonly classCounts = computed(() => playersByClass(this.data()?.players ?? []));
  protected readonly classes = WOW_CLASSES;

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

  protected applyScope(scope: CompositionScope): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { report: scope.reportCode, encounter: scope.encounterId, difficulty: scope.difficulty },
    });
  }

  protected retry(): void {
    const state = this.state();
    if ('scope' in state) void this.load(state.scope);
  }

  protected roleLabel(role: CompositionPlayer['role']): string {
    if (role === 'TANK') return 'Tank';
    if (role === 'HEAL') return 'Healer';
    if (role === 'DPS') return 'DPS';
    return 'Unclassified';
  }

  protected output(player: CompositionPlayer): string {
    const value = player.role === 'HEAL' ? player.bestPull.hps : player.bestPull.dps;
    return `${this.number(value)} ${player.role === 'HEAL' ? 'HPS' : 'DPS'}`;
  }

  protected reliability(player: CompositionPlayer): string {
    return player.reliability.value == null ? 'PENDING' : `${Math.round(player.reliability.value)}%`;
  }

  protected itemUrl(id: number | null): string | null {
    return id ? `https://www.wowhead.com/item=${id}` : null;
  }

  protected talentLabel(talent: CompositionPlayer['character']['talents'][number]): string | null {
    return cleanTalentName(talent);
  }

  protected classColor(className: string | null): string {
    return WOW_CLASSES.find(item => item.key === classKey(className))?.color ?? '#77858a';
  }

  protected percentage(value: number): number {
    const total = this.summary().roster;
    return total ? Math.round(value * 1000 / total) / 10 : 0;
  }

  protected number(value: number | null, decimals = 0): string {
    return value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('en-US', { maximumFractionDigits: decimals });
  }

  private async load(scope: CompositionScope): Promise<void> {
    const request = ++this.requestSequence;
    this.state.set({ kind: 'loading', scope });
    try {
      const data = await this.loader.execute(scope);
      if (request !== this.requestSequence) return;
      if (data.encounter && (data.encounter.id !== scope.encounterId || data.encounter.difficulty !== scope.difficulty)) {
        throw new ApiContractError('wcl-composition-telemetry-v1', 'response scope differs from the explicit request');
      }
      this.state.set({ kind: data.status === 'ready' ? 'ready' : 'empty', scope, data });
    } catch (error) {
      if (request !== this.requestSequence) return;
      const contractError = error instanceof ApiContractError;
      this.state.set({
        kind: 'error', scope,
        message: contractError ? 'The server response did not satisfy the Composition evidence contract.' : error instanceof Error ? error.message : 'Composition could not be loaded.',
        retryable: error instanceof LegacyApiError ? error.retryable : !contractError,
      });
    }
  }
}
