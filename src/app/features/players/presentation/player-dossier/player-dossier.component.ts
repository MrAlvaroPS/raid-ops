import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PlayersPlayer, PlayersSnapshot, ReliabilityDimension } from '../../domain/players.models';
import { outputLabel, publicComponentValue, roleLabel } from '../../domain/players.rules';

@Component({
  selector: 'app-player-dossier',
  templateUrl: './player-dossier.component.html',
  styleUrl: './player-dossier.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDossierComponent {
  readonly player = input.required<PlayersPlayer>();
  readonly snapshot = input.required<PlayersSnapshot>();

  protected role(): string {
    return roleLabel(this.player().role);
  }
  protected output(): string {
    return outputLabel(this.player());
  }
  protected reliability(): string {
    const profile = this.player().reliability;
    return profile?.status === 'published' && profile.value != null
      ? Math.round(profile.value).toString()
      : '—';
  }
  protected reliabilityStatus(): string {
    const profile = this.player().reliability;
    if (!profile) return 'NO PROFILE';
    if (profile.status === 'published') return 'RELIABLE';
    if (profile.status === 'data-error') return 'DATA ERROR';
    return 'PENDING';
  }
  protected reliabilityTone(): string {
    const profile = this.player().reliability;
    if (!profile) return 'muted';
    if (profile.status === 'published') return 'good';
    if (profile.status === 'data-error') return 'bad';
    return 'pending';
  }
  protected component(dimension: ReliabilityDimension): string {
    const profile = this.player().reliability;
    const component = profile?.components[dimension];
    if (!component) return '—';
    const value = publicComponentValue(profile, component);
    return value == null
      ? component.status === 'scored'
        ? 'GATED'
        : 'PENDING'
      : Math.round(value).toString();
  }
  protected componentMeta(dimension: ReliabilityDimension): string {
    const profile = this.player().reliability;
    const component = profile?.components[dimension];
    if (!component) return 'No profile evidence';
    if (profile?.status !== 'published' && component.status === 'scored')
      return 'Scored internally; overall publication gate is closed';
    return `${component.opportunityCount} opportunities · ${component.failureCount} failures`;
  }
  protected metric(value: number | null): string {
    return value == null ? '—' : Math.round(value).toLocaleString('en-US');
  }
  protected percentage(value: number | null): string {
    return value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(1)}%`;
  }
  protected date(value: number | null): string {
    return value == null ? '—' : new Date(value).toLocaleDateString();
  }
  protected mechanicEntries(): readonly [string, number][] {
    return Object.entries(this.player().encounterFacts.mechanics).sort((a, b) => b[1] - a[1]);
  }
  protected initial(): string {
    return this.player().name.slice(0, 1).toUpperCase();
  }
}
