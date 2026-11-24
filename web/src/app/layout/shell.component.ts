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
      background: #0f766e;
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
      color: #ccfbf1;
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
      border: 1px solid #ccfbf1;
      border-radius: 8px;
      background: transparent;
      color: #fff;
      cursor: pointer;
    }
    main {
      min-height: calc(100vh - 56px);
      padding: 0 1rem;
      background: #f1f5f9;
    }
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
}
