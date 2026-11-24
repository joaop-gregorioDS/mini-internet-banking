import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Protege as rotas autenticadas. Sem sessão, redireciona para /login guardando a URL de destino. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Páginas públicas (login/registro) não devem ser exibidas para quem já está logado. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};
