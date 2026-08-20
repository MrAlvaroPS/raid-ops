import { ChangeDetectionStrategy, Component } from '@angular/core';
import { buildMigrationReadiness } from '../../application/migration-readiness';
import { PRODUCT_FEATURES } from '../../domain/feature-catalog';

@Component({
  selector: 'app-foundation-page',
  templateUrl: './foundation.page.html',
  styleUrl: './foundation.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationPage {
  protected readonly readiness = buildMigrationReadiness(PRODUCT_FEATURES);
}
