import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { LegacyApiClient } from '../../../core/http/legacy-api-client';
import { ProgressApiRepository } from './progress-api.repository';

describe('Progress API repository', () => {
  it('uses one local index read and an exact encounter+difficulty scoped read without report', async () => {
    const index = {
      ok: true,
      version: 'avoid-history-read-v1',
      status: 'raid-catalog-missing',
      zone: null,
      pulls: [{ mode: 'all' }],
      networkExecuted: false,
      wclCallsExecuted: 0,
      needsRefresh: false,
    };
    const get = vi.fn().mockReturnValueOnce(of(index)).mockReturnValueOnce(of({}));
    const http = { get } as unknown as HttpClient;
    const repository = new ProgressApiRepository(new LegacyApiClient(http));
    await repository.loadIndex();
    expect(get).toHaveBeenCalledWith('/api/wcl/home-history');
    expect(String(get.mock.calls[0][0])).not.toContain('report=');
    await expect(
      repository.loadScope({ encounterId: 3010, difficulty: 5, scopeKey: '3010:d5' }),
    ).rejects.toThrow();
    expect(get.mock.calls[1][0]).toBe('/api/wcl/home-history?encounter=3010&difficulty=5');
  });
});
