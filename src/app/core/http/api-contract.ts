export type ContractDecoder<T> = (value: unknown) => T;

export class ApiContractError extends Error {
  override readonly name = 'ApiContractError';

  constructor(readonly contract: string, message: string) {
    super(`${contract}: ${message}`);
  }
}

export function requireRecord(value: unknown, contract: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiContractError(contract, 'expected an object response');
  }
  return value as Record<string, unknown>;
}

export function optionalRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function optionalFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

export function nonNegativeNumber(value: unknown, fallback = 0): number {
  const result = optionalFiniteNumber(value);
  return result != null && result >= 0 ? result : fallback;
}

export function requirePositiveInteger(value: unknown, field: string, contract: string): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiContractError(contract, `${field} must be a positive integer`);
  }
  return number;
}
