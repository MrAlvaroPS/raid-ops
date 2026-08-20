import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DamageHealingApiRepository } from './damage-healing-api.repository';

describe('DamageHealingApiRepository', () => {
  it('sends the same explicit scope to both existing reads and preserves a real empty state', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), DamageHealingApiRepository] });
    const repository = TestBed.inject(DamageHealingApiRepository);
    const http = TestBed.inject(HttpTestingController);
    const result = repository.load({ reportCode: 'ABC123XYZ', encounterId: 3010, difficulty: 5 });
    const query = 'report=ABC123XYZ&encounter=3010&difficulty=5';
    const report = http.expectOne(`/api/wcl/report?${query}`);
    const telemetry = http.expectOne(`/api/wcl/telemetry?${query}`);
    expect(report.request.method).toBe('GET');
    expect(telemetry.request.method).toBe('GET');
    report.flush({
      ok: true, generatedAt: 1, source: 'Warcraft Logs API v2', configured: { reportCode: 'ABC123XYZ' }, report: { code: 'ABC123XYZ' },
      encounter: null, message: 'No boss encounter fights found.',
    });
    telemetry.flush({ ok: true, generatedAt: 2, reportCode: 'ABC123XYZ', telemetry: null, reason: 'No completed encounter pull.' });
    await expect(result).resolves.toMatchObject({ status: 'empty', reportCode: 'ABC123XYZ', bestPull: null });
    http.verify();
  });

  it('degrades to report data when telemetry transport is unavailable', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), DamageHealingApiRepository] });
    const repository = TestBed.inject(DamageHealingApiRepository);
    const http = TestBed.inject(HttpTestingController);
    const result = repository.load({ reportCode: 'ABC123XYZ', encounterId: 3010, difficulty: 5 });
    const query = 'report=ABC123XYZ&encounter=3010&difficulty=5';
    http.expectOne(`/api/wcl/report?${query}`).flush({
      ok: true, generatedAt: 1, source: 'Warcraft Logs API v2', configured: { reportCode: 'ABC123XYZ' }, report: { code: 'ABC123XYZ' },
      encounter: { id: 3010, name: 'Test Boss', difficulty: 5, difficultyName: 'Mythic', scopeKey: '3010:d5', pulls: 1 },
      phaseModel: { kind: 'absolute-stage' }, overview: {
        bestPull: { fightId: 1, pullNumber: 1, fightPercentage: 40, durationMs: 10_000, stages: [{ absoluteStageIndex: 1, semanticPhaseId: 1, startTime: 0, endTime: 10_000 }] },
        raidDps: 1000, raidHps: 200, executeDps: null, overhealPct: 12,
      }, diagnostics: { detailStatus: 'ready' }, evidenceContract: { scopeIdentity: 'encounter+difficulty', crossDifficultyComparisonForbidden: true },
    });
    http.expectOne(`/api/wcl/telemetry?${query}`).flush({ error: 'temporary' }, { status: 503, statusText: 'Unavailable' });
    await expect(result).resolves.toMatchObject({ status: 'ready', partialReasons: expect.arrayContaining(['telemetry endpoint unavailable']) });
    http.verify();
  });
});
