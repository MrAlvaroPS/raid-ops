import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProgressChartSeries } from '../../domain/progress.models';

@Component({
  selector: 'app-progress-chart',
  templateUrl: './progress-chart.component.html',
  styleUrl: './progress-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressChartComponent {
  readonly series = input.required<ProgressChartSeries>();
  protected readonly bestLine = computed(() => this.points(this.series().bestLine));
  protected readonly formLine = computed(() => this.points(this.series().formLine));
  protected readonly first = computed(() => this.series().visible.at(0)?.pullNumber ?? null);
  protected readonly middle = computed<number | null>(
    () =>
      this.series().visible.at(Math.floor((this.series().visible.length - 1) / 2))?.pullNumber ??
      null,
  );
  protected readonly last = computed(() => this.series().visible.at(-1)?.pullNumber ?? null);

  private points(rows: readonly { readonly x: number; readonly y: number }[]): string {
    return rows.map((row) => `${row.x},${row.y}`).join(' ');
  }
}
