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
import { LoadDefensiveAudit } from '../../application/load-defensive-audit';
import {
  DefensiveAuditFilter,
  DefensiveAuditScope,
  DefensiveAuditSnapshot,
  DefensiveDeathChain,
  DefensiveParticipant,
} from '../../domain/defensive-audit.models';
import {
  filterParticipants,
  findDeathChain,
  participantLabel,
} from '../../domain/defensive-audit.rules';
import {
  DEFENSIVE_AUDIT_PROVIDERS,
  DEFENSIVE_AUDIT_REPOSITORY,
} from '../../infrastructure/defensive-audit-api.repository';

type PageState =
  | { readonly kind: 'context-required' }
  | { readonly kind: 'loading'; readonly scope: DefensiveAuditScope }
  | {
      readonly kind: 'ready' | 'empty';
      readonly scope: DefensiveAuditScope;
      readonly data: DefensiveAuditSnapshot;
    }
  | {
      readonly kind: 'error';
      readonly scope: DefensiveAuditScope;
      readonly message: string;
      readonly retryable: boolean;
    };

@Component({
  selector: 'app-defensive-audit-page',
  imports: [WclScopeFormComponent],
  providers: DEFENSIVE_AUDIT_PROVIDERS,
  templateUrl: './defensive-audit.page.html',
  styleUrl: './defensive-audit.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefensiveAuditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loader = new LoadDefensiveAudit(inject(DEFENSIVE_AUDIT_REPOSITORY));
  private requestSequence = 0;
  private loadedScopeKey: string | null = null;

  protected readonly state = signal<PageState>({ kind: 'context-required' });
  protected readonly filter = signal<DefensiveAuditFilter>('all');
  protected readonly requestedChainKey = signal<string | null>(null);
  protected readonly data = computed(() => {
    const state = this.state();
    return state.kind === 'ready' || state.kind === 'empty' ? state.data : null;
  });
  protected readonly visibleParticipants = computed(() =>
    filterParticipants(this.data()?.participants ?? [], this.filter()),
  );
  protected readonly selectedChain = computed(() =>
    findDeathChain(this.data()?.chains ?? [], this.requestedChainKey()),
  );

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const scope = parseWclScope(
        params.get('report'),
        params.get('encounter'),
        params.get('difficulty'),
      );
      const requestedFilter = params.get('view');
      this.filter.set(
        requestedFilter === 'deaths' || requestedFilter === 'linked' ? requestedFilter : 'all',
      );
      this.requestedChainKey.set(params.get('death'));
      if (!scope) {
        this.loadedScopeKey = null;
        this.state.set({ kind: 'context-required' });
        return;
      }
      const scopeKey = `${scope.reportCode}:${scope.encounterId}:d${scope.difficulty}`;
      if (scopeKey === this.loadedScopeKey && this.data()) return;
      this.loadedScopeKey = scopeKey;
      void this.load(scope);
    });
  }

  protected applyScope(scope: DefensiveAuditScope): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        report: scope.reportCode,
        encounter: scope.encounterId,
        difficulty: scope.difficulty,
        view: null,
        death: null,
      },
    });
  }

  protected setFilter(filter: DefensiveAuditFilter): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: filter === 'all' ? null : filter },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected selectChain(chain: DefensiveDeathChain): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { death: chain.key },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected retry(): void {
    const state = this.state();
    if ('scope' in state) void this.load(state.scope);
  }

  protected participantMeta(participant: DefensiveParticipant): string {
    return participantLabel(participant);
  }

  protected initial(participant: DefensiveParticipant): string {
    return participant.name.slice(0, 1).toUpperCase();
  }

  protected count(value: number | null): string {
    return value == null ? '—' : Math.round(value).toLocaleString('en-US');
  }

  protected duration(value: number | null): string {
    if (value == null) return '—';
    const seconds = Math.max(0, value / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toFixed(1).padStart(4, '0')}`;
  }

  protected timeline(
    chain: DefensiveDeathChain,
  ): readonly DefensiveDeathChain['evidence'][number][] {
    return [...chain.evidence].sort((a, b) => b.occurredMsBeforeDeath - a.occurredMsBeforeDeath);
  }

  protected eventTime(chain: DefensiveDeathChain, beforeDeath: number): string {
    return this.duration(Math.max(0, (chain.fightRelativeMs ?? 0) - beforeDeath));
  }

  protected confidenceLabel(confidence: string): string {
    return `${confidence.toUpperCase()} SIGNAL`;
  }

  protected confidenceTone(confidence: string): string {
    return confidence === 'high' || confidence === 'confirmed'
      ? 'strong'
      : confidence === 'medium'
        ? 'medium'
        : 'weak';
  }

  private async load(scope: DefensiveAuditScope): Promise<void> {
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
            : 'Defensive Audit could not be loaded.',
        retryable: !contractError && (!(error instanceof LegacyApiError) || error.retryable),
      });
    }
  }
}
