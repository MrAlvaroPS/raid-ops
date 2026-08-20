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
import { LoadPlayers } from '../../application/load-players';
import {
  PlayersPlayer,
  PlayersScope,
  PlayersSnapshot,
  ReliabilityDimension,
} from '../../domain/players.models';
import {
  outputLabel,
  publicComponentValue,
  roleLabel,
  rosterReliability,
} from '../../domain/players.rules';
import { PLAYERS_PROVIDERS, PLAYERS_REPOSITORY } from '../../infrastructure/players-api.repository';
import { PlayerDossierComponent } from '../player-dossier/player-dossier.component';

type PageState =
  | { readonly kind: 'context-required' }
  | { readonly kind: 'loading'; readonly scope: PlayersScope }
  | { readonly kind: 'ready'; readonly scope: PlayersScope; readonly data: PlayersSnapshot }
  | { readonly kind: 'empty'; readonly scope: PlayersScope; readonly data: PlayersSnapshot }
  | { readonly kind: 'external'; readonly scope: PlayersScope; readonly data: PlayersSnapshot }
  | {
      readonly kind: 'error';
      readonly scope: PlayersScope;
      readonly message: string;
      readonly retryable: boolean;
    };

@Component({
  selector: 'app-players-page',
  imports: [WclScopeFormComponent, PlayerDossierComponent],
  providers: PLAYERS_PROVIDERS,
  templateUrl: './players.page.html',
  styleUrl: './players.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loader = new LoadPlayers(inject(PLAYERS_REPOSITORY));
  private requestSequence = 0;
  private loadedScopeKey: string | null = null;

  protected readonly state = signal<PageState>({ kind: 'context-required' });
  protected readonly selectedActorId = signal<number | null>(null);
  protected readonly data = computed(() => {
    const state = this.state();
    return state.kind === 'ready' || state.kind === 'empty' || state.kind === 'external'
      ? state.data
      : null;
  });
  protected readonly selected = computed(
    () =>
      this.data()?.players.find((player) => player.actorId === this.selectedActorId()) ??
      this.data()?.players[0] ??
      null,
  );
  protected readonly rosterScore = computed(() => rosterReliability(this.data()?.players ?? []));
  protected readonly publishedProfiles = computed(
    () =>
      this.data()?.players.filter((player) => player.reliability?.status === 'published').length ??
      0,
  );
  protected readonly pendingProfiles = computed(
    () =>
      this.data()?.players.filter((player) => player.reliability?.status === 'shadow-pending')
        .length ?? 0,
  );
  protected readonly dataErrors = computed(
    () =>
      this.data()?.players.filter((player) => player.reliability?.status === 'data-error').length ??
      0,
  );

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const scope = parseWclScope(
        params.get('report'),
        params.get('encounter'),
        params.get('difficulty'),
      );
      const requestedPlayer = Number(params.get('player'));
      this.selectedActorId.set(
        Number.isInteger(requestedPlayer) && requestedPlayer > 0 ? requestedPlayer : null,
      );
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

  protected applyScope(scope: PlayersScope): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        report: scope.reportCode,
        encounter: scope.encounterId,
        difficulty: scope.difficulty,
        player: null,
      },
    });
  }

  protected selectPlayer(player: PlayersPlayer): void {
    this.selectedActorId.set(player.actorId);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { player: player.actorId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected retry(): void {
    const state = this.state();
    if ('scope' in state) void this.load(state.scope);
  }

  protected role(player: PlayersPlayer): string {
    return roleLabel(player.role);
  }
  protected output(player: PlayersPlayer): string {
    return outputLabel(player);
  }
  protected reliability(player: PlayersPlayer): string {
    return player.reliability?.status === 'published' && player.reliability.value != null
      ? Math.round(player.reliability.value).toString()
      : '—';
  }
  protected reliabilityStatus(player: PlayersPlayer): string {
    if (!player.reliability) return 'NO PROFILE';
    if (player.reliability.status === 'published') return 'RELIABLE';
    if (player.reliability.status === 'data-error') return 'DATA ERROR';
    return 'PENDING';
  }
  protected reliabilityTone(player: PlayersPlayer): string {
    if (!player.reliability) return 'muted';
    if (player.reliability.status === 'published') return 'good';
    if (player.reliability.status === 'data-error') return 'bad';
    return 'pending';
  }
  protected component(player: PlayersPlayer, dimension: ReliabilityDimension): string {
    const component = player.reliability?.components[dimension];
    if (!component) return '—';
    const value = publicComponentValue(player.reliability, component);
    return value == null
      ? component.status === 'scored'
        ? 'GATED'
        : 'PENDING'
      : Math.round(value).toString();
  }
  protected metric(value: number | null): string {
    return value == null ? '—' : Math.round(value).toLocaleString('en-US');
  }
  protected initial(player: PlayersPlayer): string {
    return player.name.slice(0, 1).toUpperCase();
  }

  private async load(scope: PlayersScope): Promise<void> {
    const request = ++this.requestSequence;
    this.state.set({ kind: 'loading', scope });
    try {
      const data = await this.loader.execute(scope);
      if (request !== this.requestSequence) return;
      if (
        !this.selectedActorId() ||
        !data.players.some((player) => player.actorId === this.selectedActorId())
      )
        this.selectedActorId.set(data.players[0]?.actorId ?? null);
      const kind =
        data.status === 'ready'
          ? 'ready'
          : data.status === 'external-not-applicable'
            ? 'external'
            : 'empty';
      this.state.set({ kind, scope, data });
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
            : 'Players could not be loaded.',
        retryable: !contractError && (!(error instanceof LegacyApiError) || error.retryable),
      });
    }
  }
}
