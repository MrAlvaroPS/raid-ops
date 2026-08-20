import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AbsoluteStage, ThroughputMode, WclGraphSeries } from '../../domain/damage-healing.models';
import { chartArea, chartPolyline, stageBands } from '../../domain/damage-healing.rules';

@Component({
  selector: 'app-throughput-chart',
  templateUrl: './throughput-chart.component.html',
  styleUrl: './throughput-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThroughputChartComponent {
  readonly graph = input<WclGraphSeries | null>(null);
  readonly stages = input<readonly AbsoluteStage[]>([]);
  readonly durationMs = input(0);
  readonly mode = input<ThroughputMode>('damage');

  protected readonly polyline = computed(() => chartPolyline(this.graph()?.values ?? []));
  protected readonly area = computed(() => chartArea(this.graph()?.values ?? []));
  protected readonly bands = computed(() => stageBands(this.stages(), this.durationMs()));
  protected readonly maximum = computed(() => Math.max(...(this.graph()?.values ?? [0])));
  protected readonly ariaLabel = computed(() => `${this.mode() === 'damage' ? 'Damage' : 'Healing'} Total series across ordered WCL graph buckets for the selected best pull`);

  protected compact(value: number): string {
    if (!Number.isFinite(value)) return '—';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
  }

  protected duration(value: number): string {
    const seconds = Math.max(0, Math.round(value / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
}
