export type ProductFeatureId =
  | 'command-center'
  | 'live'
  | 'progress'
  | 'pull-lab'
  | 'damage-healing'
  | 'mechanics'
  | 'defensive-audit'
  | 'players'
  | 'composition'
  | 'loot'
  | 'data-logs';

export type SurfaceOwner = 'legacy' | 'angular';
export type MigrationComplexity = 'medium' | 'high' | 'very-high';

export interface FeatureDefinition {
  readonly id: ProductFeatureId;
  readonly route: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: string;
  readonly owner: SurfaceOwner;
  readonly complexity: MigrationComplexity;
  readonly migrationPhase: number;
}
