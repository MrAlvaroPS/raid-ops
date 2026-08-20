import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { RUNTIME_CONFIG } from '../config/runtime-config';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  const { apiBaseUrl } = inject(RUNTIME_CONFIG);
  if (!apiBaseUrl || !request.url.startsWith('/api/')) return next(request);
  return next(request.clone({ url: `${apiBaseUrl}${request.url}` }));
};
