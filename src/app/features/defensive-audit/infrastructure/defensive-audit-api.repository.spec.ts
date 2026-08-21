import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { LegacyApiClient } from '../../../core/http/legacy-api-client';
import { DefensiveAuditApiRepository } from './defensive-audit-api.repository';

describe('Defensive Audit API repository', () => {
  it('uses one existing exact-scope operational execution request', async () => {
    const get = vi.fn(() =>
      of({
        ok: true,
        generatedAt: 1,
        status: 'waiting-for-completed-pull',
        telemetry: null,
      }),
    );
    const repository = new DefensiveAuditApiRepository(
      new LegacyApiClient({ get } as unknown as HttpClient),
    );
    await repository.load({ reportCode: 'ABC123', encounterId: 3010, difficulty: 5 });
    expect(get).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledWith(
      '/api/wcl/operational-execution?report=ABC123&encounter=3010&difficulty=5',
    );
  });
});
