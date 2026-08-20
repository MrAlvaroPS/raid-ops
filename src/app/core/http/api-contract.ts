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

export function requirePositiveInteger(value: unknown, field: string, contract: string): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiContractError(contract, `${field} must be a positive integer`);
  }
  return number;
}
