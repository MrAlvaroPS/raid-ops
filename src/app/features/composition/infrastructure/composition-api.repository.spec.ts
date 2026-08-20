import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CompositionApiRepository } from './composition-api.repository';

describe('CompositionApiRepository', () => {
  it('sends report, encounter and difficulty together and decodes the empty state', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CompositionApiRepository],
    });
    const repository = TestBed.inject(CompositionApiRepository);
    const http = TestBed.inject(HttpTestingController);

    const result = repository.load({ reportCode: 'ABC123XYZ', encounterId: 3010, difficulty: 5 });
    const request = http.expectOne('/api/wcl/telemetry?report=ABC123XYZ&encounter=3010&difficulty=5');
    expect(request.request.method).toBe('GET');
    request.flush({ ok: true, reportCode: 'ABC123XYZ', telemetry: null, reason: 'No completed encounter pull.' });

    await expect(result).resolves.toMatchObject({ status: 'empty', players: [] });
    http.verify();
  });
});
