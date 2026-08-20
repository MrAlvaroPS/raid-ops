import { InjectionToken, Provider } from '@angular/core';

export interface RaidOpsRuntimeConfig {
  readonly apiBaseUrl: string;
  readonly legacyAppUrl: string;
  readonly migrationMode: 'foundation';
  readonly productionSwitchEnabled: false;
}

declare global {
  interface Window {
    __RAID_OPS_CONFIG__?: Partial<RaidOpsRuntimeConfig>;
  }
}

const DEFAULT_CONFIG: RaidOpsRuntimeConfig = Object.freeze({
  apiBaseUrl: '',
  legacyAppUrl: 'http://127.0.0.1:5173',
  migrationMode: 'foundation',
  productionSwitchEnabled: false,
});

function cleanBaseUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  return value.trim().replace(/\/$/, '');
}

export function readRuntimeConfig(input: unknown = globalThis.window?.__RAID_OPS_CONFIG__): RaidOpsRuntimeConfig {
  const candidate = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  if (candidate['productionSwitchEnabled'] === true) {
    throw new Error('Phase 3 cannot enable the Angular production switch');
  }
  if (candidate['migrationMode'] != null && candidate['migrationMode'] !== 'foundation') {
    throw new Error('Unsupported Angular migration mode');
  }
  return Object.freeze({
    apiBaseUrl: cleanBaseUrl(candidate['apiBaseUrl'], DEFAULT_CONFIG.apiBaseUrl),
    legacyAppUrl: cleanBaseUrl(candidate['legacyAppUrl'], DEFAULT_CONFIG.legacyAppUrl),
    migrationMode: 'foundation',
    productionSwitchEnabled: false,
  });
}

export const RUNTIME_CONFIG = new InjectionToken<RaidOpsRuntimeConfig>('RAID_OPS_RUNTIME_CONFIG');

export function provideRuntimeConfig(config?: RaidOpsRuntimeConfig): Provider {
  return { provide: RUNTIME_CONFIG, useFactory: () => config ?? readRuntimeConfig() };
}
