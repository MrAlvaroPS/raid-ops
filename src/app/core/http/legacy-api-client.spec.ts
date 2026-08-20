import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { RaidOpsRuntimeConfig, RUNTIME_CONFIG } from '../config/runtime-config';
import { apiBaseUrlInterceptor } from './api-base-url.interceptor';
import { ApiContractError, requireRecord } from './api-contract';
import { LegacyApiClient } from './legacy-api-client';

interface ProbeResult { readonly ok: boolean }
const decodeProbe = (value: unknown): ProbeResult => {
  const record = requireRecord(value, 'probe-v1');
  if (record['ok'] !== true) throw new ApiContractError('probe-v1', 'ok must be true');
  return { ok: true };
};

describe('LegacyApiClient', () => {
  let client: LegacyApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    const config: RaidOpsRuntimeConfig = {
      apiBaseUrl: 'http://legacy.test',
      legacyAppUrl: 'http://legacy.test',
      migrationMode: 'incremental',
      productionSwitchEnabled: false,
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiBaseUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: RUNTIME_CONFIG, useValue: config },
      ],
    });
    client = TestBed.inject(LegacyApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('prefixes same-contract API paths and decodes unknown responses at runtime', async () => {
    const result = firstValueFrom(client.get('/api/probe', decodeProbe));
    http.expectOne('http://legacy.test/api/probe').flush({ ok: true });
    await expect(result).resolves.toEqual({ ok: true });
  });

  it('does not let an invalid backend shape cross the anti-corruption boundary', async () => {
    const result = firstValueFrom(client.get('/api/probe', decodeProbe));
    http.expectOne('http://legacy.test/api/probe').flush({ ok: false });
    await expect(result).rejects.toBeInstanceOf(ApiContractError);
  });

  it('classifies retryable HTTP failures without inventing a fallback payload', async () => {
    const result = firstValueFrom(client.get('/api/probe', decodeProbe));
    http.expectOne('http://legacy.test/api/probe').flush({}, { status: 503, statusText: 'Unavailable' });
    await expect(result).rejects.toMatchObject({ status: 503, retryable: true });
  });
});
