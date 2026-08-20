import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PullLabApiRepository } from './pull-lab-api.repository';

describe('PullLabApiRepository', () => {
  it('uses one existing operational read with explicit report, encounter and difficulty', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PullLabApiRepository],
    });
    const repository = TestBed.inject(PullLabApiRepository);
    const http = TestBed.inject(HttpTestingController);
    const result = repository.load({ reportCode: 'ABC123XYZ', encounterId: 3010, difficulty: 5 });
    const request = http.expectOne(
      '/api/wcl/operational-execution?report=ABC123XYZ&encounter=3010&difficulty=5',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      ok: true,
      status: 'waiting-for-completed-pull',
      generatedAt: 1,
      telemetry: null,
    });
    await expect(result).resolves.toMatchObject({
      status: 'empty',
      reportCode: 'ABC123XYZ',
      pulls: [],
    });
    http.verify();
  });
});
