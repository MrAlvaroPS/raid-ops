import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiContractError, ContractDecoder } from './api-contract';

export class LegacyApiError extends Error {
  override readonly name = 'LegacyApiError';

  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

@Injectable({ providedIn: 'root' })
export class LegacyApiClient {
  constructor(private readonly http: HttpClient) {}

  get<T>(path: `/api/${string}`, decode: ContractDecoder<T>): Observable<T> {
    return this.http.get<unknown>(path).pipe(
      map(payload => decode(payload)),
      catchError(error => throwError(() => this.normalizeError(error))),
    );
  }

  private normalizeError(error: unknown): Error {
    if (error instanceof ApiContractError || error instanceof LegacyApiError) return error;
    if (error instanceof HttpErrorResponse) {
      return new LegacyApiError(
        error.status ? `Legacy API request failed with HTTP ${error.status}` : 'Legacy API is unreachable',
        error.status,
        error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500,
        { cause: error },
      );
    }
    return new LegacyApiError('Unexpected legacy API failure', 0, false, { cause: error });
  }
}
