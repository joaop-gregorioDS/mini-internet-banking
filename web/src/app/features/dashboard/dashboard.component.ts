import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

interface AccountResponse {
  accountId: string;
  ownerName: string;
  balance: number;
}

/** Placeholder da Fase 4: prova o fluxo autenticado (guard + interceptor). Será substituído na Fase 5. */
@Component({
  selector: 'mb-dashboard',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <h1>Olá, {{ auth.user()?.name }}</h1>
      @if (account(); as acc) {
        <p class="balance">Saldo: {{ acc.balance | currency: 'BRL' }}</p>
      } @else {
        <p class="muted">Carregando saldo…</p>
      }
    </section>
  `,
  styles: `
    .panel { max-width: 720px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgb(0 0 0 / 8%); }
    .balance { font-size: 1.75rem; font-weight: 700; color: #0f766e; }
    .muted { color: #64748b; }
  `,
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly account = signal<AccountResponse | null>(null);

  constructor() {
    this.http.get<AccountResponse>('/api/accounts/me').subscribe((acc) => this.account.set(acc));
  }
}
