import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Anexa o Bearer token às chamadas da API e, em caso de 401, renova a sessão uma vez
 * e repete a requisição original. Se o refresh falhar, encerra a sessão.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const isApi = req.url.startsWith('/api');
  const isAuthEndpoint = req.url.startsWith('/api/auth/');
  if (!isApi || isAuthEndpoint) {
    return next(req);
  }

  const withToken = (token: string) =>
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  const token = auth.accessToken();
  const first = token ? withToken(token) : req;

  return next(first).pipe(
    catchError((error: unknown) => {
      const unauthorized = error instanceof HttpErrorResponse && error.status === 401;
      if (!unauthorized || !auth.isAuthenticated()) {
        return throwError(() => error);
      }

      return auth.refreshOnce().pipe(
        switchMap((session) => next(withToken(session.accessToken))),
        catchError(() => {
          auth.logout();
          return throwError(
            () =>
              new HttpErrorResponse({
                status: 401,
                error: { title: 'Sessão expirada', detail: 'Sua sessão expirou. Entre novamente.' },
              }),
          );
        }),
      );
    }),
  );
};
