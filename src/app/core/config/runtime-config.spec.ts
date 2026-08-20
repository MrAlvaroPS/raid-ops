import { readRuntimeConfig } from './runtime-config';

describe('readRuntimeConfig', () => {
  it('normalizes runtime URLs while keeping the production switch disabled', () => {
    const config = readRuntimeConfig({
      apiBaseUrl: 'http://127.0.0.1:5173/',
      legacyAppUrl: 'http://127.0.0.1:5173/',
    });

    expect(config.apiBaseUrl).toBe('http://127.0.0.1:5173');
    expect(config.legacyAppUrl).toBe('http://127.0.0.1:5173');
    expect(config.productionSwitchEnabled).toBe(false);
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('rejects an attempt to activate Angular ownership during phase 2', () => {
    expect(() => readRuntimeConfig({ productionSwitchEnabled: true })).toThrowError(
      /cannot enable the Angular production switch/i,
    );
  });
});
