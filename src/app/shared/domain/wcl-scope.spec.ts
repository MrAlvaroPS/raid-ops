import { parseWclScope } from './wcl-scope';

describe('WCL scope', () => {
  it('accepts an explicit report, encounter and supported difficulty', () => {
    expect(parseWclScope(' ABC123 ', '3010', '5')).toEqual({ reportCode: 'ABC123', encounterId: 3010, difficulty: 5 });
  });

  it.each([
    ['ABC-123', '3010', '5'],
    ['ABC123', '0', '5'],
    ['ABC123', '3010', '6'],
    ['', '3010', '5'],
  ])('rejects incomplete or unsupported scopes', (report, encounter, difficulty) => {
    expect(parseWclScope(report, encounter, difficulty)).toBeNull();
  });
});
