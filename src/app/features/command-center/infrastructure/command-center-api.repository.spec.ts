import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { LegacyApiClient } from '../../../core/http/legacy-api-client';
import { CommandCenterApiRepository } from './command-center-api.repository';

describe('Command Center API repository', () => {
  it('uses one existing exact-scope operational execution request', async () => {
    const get = vi.fn(() =>
      of({
        ok: true,
        generatedAt: 1,
        status: 'waiting-for-first-combat',
        report: { code: 'ABC123' },
        encounter: null,
        telemetry: null,
      }),
    );
    const repository = new CommandCenterApiRepository(
      new LegacyApiClient({ get } as unknown as HttpClient),
    );
    await repository.load({ reportCode: 'ABC123', encounterId: 3010, difficulty: 5 });
    expect(get).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledWith(
      '/api/wcl/operational-execution?report=ABC123&encounter=3010&difficulty=5',
    );
  });
});
