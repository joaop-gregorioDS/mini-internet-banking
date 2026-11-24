import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../notifications/toast.service';

/** Formato ProblemDetails (RFC 7807) devolvido pela API, com "errors" nas validações. */
interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

/** Converte o erro da API em uma mensagem curta para o usuário. */
export function describeHttpError(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }

  const body = (error.error ?? {}) as ProblemDetails;
  const firstValidation = body.errors ? Object.values(body.errors).flat()[0] : undefined;
  return firstValidation ?? body.detail ?? body.title ?? 'Ocorreu um erro inesperado.';
}

/**
 * Mostra um toast para erros finais. Deve ficar ANTES do authInterceptor na lista,
 * assim só chega aqui o erro depois da tentativa de renovação de sessão.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toasts = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      // Falha de refresh é mensagem interna: o authInterceptor já informa "Sessão expirada".
      const isSilentRefresh = req.url.endsWith('/api/auth/refresh');
      if (error instanceof HttpErrorResponse && !isSilentRefresh) {
        toasts.error(describeHttpError(error));
      }
      return throwError(() => error);
    }),
  );
};
