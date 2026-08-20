import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RUNTIME_CONFIG } from '../../../../core/config/runtime-config';
import { FeatureDefinition } from '../../domain/feature-definition';

@Component({
  selector: 'app-legacy-boundary-page',
  templateUrl: './legacy-boundary.page.html',
  styleUrl: './legacy-boundary.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyBoundaryPage {
  readonly feature = input.required<FeatureDefinition>();
  protected readonly legacyAppUrl = inject(RUNTIME_CONFIG).legacyAppUrl;
}
