import { ApiContractError } from '../../../core/http/api-contract';
import { decodeCompositionTelemetry } from './composition-api.contract';

const readyPayload = {
  ok: true, generatedAt: 1, reportCode: 'ABC123XYZ',
  encounter: { id: 3010, name: 'Test Boss', difficulty: 5, difficultyName: 'Mythic', scopeKey: '3010:d5', pulls: 4 },
  players: [{
    actorId: 7, name: 'Sanitized', className: 'Monk', spec: 'Windwalker', itemLevel: 640, role: 'DPS', server: 'Draenor',
    bestPull: { dps: 123456, hps: 0 },
    character: {
      gear: [{ id: 123, name: 'Test Item', itemLevel: 639, slot: 'Head' }], gearCount: 1,
      talents: [{ entryId: 44, spellId: 55, rank: 1, name: 'Test Talent' }], talentCount: 1,
      talentImportCode: 'abc', talentWowheadUrl: 'https://www.wowhead.com/talent-calc/blizzard/abc', combatantInfoSource: 'WCL CombatantInfo',
    },
    reliability: { value: null, status: 'shadow-pending', confidence: 'unknown', reason: 'Not publishable' },
  }],
  playerProfiles: { coverage: { roster: 1, withGear: 1, withTalents: 1, gearPct: 100, talentPct: 100 }, source: 'WCL CombatantInfo' },
  errors: {}, evidence: { source: 'Warcraft Logs API v2' },
  evidenceContract: { scopeIdentity: 'encounter+difficulty', crossDifficultyComparisonForbidden: true },
};

describe('Composition telemetry contract', () => {
  it('decodes the real WCL roster read model and keeps Reliability pending', () => {
    const result = decodeCompositionTelemetry(readyPayload);
    expect(result.status).toBe('ready');
    expect(result.players[0].reliability.value).toBeNull();
    expect(result.encounter?.scopeKey).toBe('3010:d5');
    expect(result.coverage?.gearPct).toBe(100);
  });

  it('rejects a response without the difficulty isolation contract', () => {
    expect(() => decodeCompositionTelemetry({ ...readyPayload, evidenceContract: {} })).toThrowError(ApiContractError);
  });

  it('rejects a mismatched scope key', () => {
    expect(() => decodeCompositionTelemetry({ ...readyPayload, encounter: { ...readyPayload.encounter, scopeKey: '3010:d4' } })).toThrowError(/scopeKey/);
  });

  it('drops unsafe external talent URLs', () => {
    const payload = structuredClone(readyPayload);
    payload.players[0].character.talentWowheadUrl = 'javascript:alert(1)';
    expect(decodeCompositionTelemetry(payload).players[0].character.talentWowheadUrl).toBeNull();
  });

  it('represents a completed-pull absence without inventing roster data', () => {
    const result = decodeCompositionTelemetry({ ok: true, reportCode: 'ABC123XYZ', telemetry: null, reason: 'No completed encounter pull.' });
    expect(result).toMatchObject({ status: 'empty', players: [], emptyReason: 'No completed encounter pull.' });
  });
});
