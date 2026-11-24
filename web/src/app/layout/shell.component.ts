import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
@Component({
  selector: 'mb-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <strong class="brand">Mini Internet Banking</strong>
      <nav>
        <a routerLink="/dashboard" routerLinkActive="active">Painel</a>
        <a routerLink="/transfer" routerLinkActive="active">Transferir</a>
        <a routerLink="/statement" routerLinkActive="active">Extrato</a>
      </nav>
      <div class="session">
        <span>{{ auth.user()?.name }}</span>
        <button type="button" (click)="auth.logout()">Sair</button>
      </div>
    </header>

    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    .topbar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--brand-gradient);
      color: #fff;
    }
    .brand {
      font-size: 1.05rem;
    }
    nav {
      display: flex;
      gap: 1rem;
      flex: 1;
    }
    nav a {
      color: var(--surface-raised);
      text-decoration: none;
    }
    nav a.active {
      color: #fff;
      font-weight: 700;
    }
    .session {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .session button {
      padding: 0.4rem 0.8rem;
      border: 1px solid var(--surface-raised);
      border-radius: 999px;
      background: transparent;
      color: #fff;
      cursor: pointer;
    }
    main {
      /* flow-root impede que a margem das telas colapse para fora do main e abra uma faixa. */
      display: flow-root;
      min-height: calc(100vh - 56px);
      padding: 0 1rem;
      background: var(--surface);
    }
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
}
