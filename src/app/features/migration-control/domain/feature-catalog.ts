import { FeatureDefinition } from './feature-definition';

export const PRODUCT_FEATURES: readonly FeatureDefinition[] = Object.freeze([
  { id: 'command-center', route: 'command-center', label: 'Command Center', shortLabel: 'Command', icon: '⌂', owner: 'legacy', complexity: 'high' },
  { id: 'live', route: 'live', label: 'LIVE', shortLabel: 'LIVE', icon: '●', owner: 'legacy', complexity: 'very-high' },
  { id: 'progress', route: 'progress', label: 'Progress', shortLabel: 'Progress', icon: '↗', owner: 'legacy', complexity: 'high' },
  { id: 'pull-lab', route: 'pull-lab', label: 'Pull Lab', shortLabel: 'Pull Lab', icon: '⌁', owner: 'legacy', complexity: 'high' },
  { id: 'damage-healing', route: 'damage-healing', label: 'Damage & Healing', shortLabel: 'Damage', icon: '⌁', owner: 'legacy', complexity: 'medium' },
  { id: 'mechanics', route: 'mechanics', label: 'Mechanics', shortLabel: 'Mechanics', icon: '◎', owner: 'legacy', complexity: 'very-high' },
  { id: 'defensive-audit', route: 'defensive-audit', label: 'Defensive Audit', shortLabel: 'Defensives', icon: '◇', owner: 'legacy', complexity: 'high' },
  { id: 'players', route: 'players', label: 'Players', shortLabel: 'Players', icon: '♟', owner: 'legacy', complexity: 'high' },
  { id: 'composition', route: 'composition', label: 'Composition', shortLabel: 'Composition', icon: '▥', owner: 'legacy', complexity: 'medium' },
  { id: 'loot', route: 'loot', label: 'Loot', shortLabel: 'Loot', icon: '▥', owner: 'legacy', complexity: 'very-high' },
  { id: 'data-logs', route: 'data-logs', label: 'Data & Logs', shortLabel: 'Data', icon: '≡', owner: 'legacy', complexity: 'very-high' },
]);
