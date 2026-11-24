import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FinanceApi } from '../../core/api/finance-api.service';
import { DashboardSummary } from '../../core/api/finance.models';
import { CategoryBarsComponent } from '../../shared/components/category-bars.component';

@Component({
  selector: 'mb-dashboard',
  imports: [CurrencyPipe, RouterLink, CategoryBarsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="head">
        <div>
          <h1>Olá, {{ auth.user()?.name }}</h1>
          @if (summary(); as s) {
            <p class="muted">Resumo de {{ monthLabel(s) }}</p>
          }
        </div>
        <div class="actions">
          <a routerLink="/transfer" class="btn">Nova transferência</a>
          <a routerLink="/statement" class="btn secondary">Ver extrato</a>
        </div>
      </header>

      @if (summary(); as s) {
        <div class="cards">
          <article class="card">
            <span class="muted">Saldo atual</span>
            <strong class="big">{{ s.balance | currency: 'BRL' }}</strong>
          </article>
          <article class="card">
            <span class="muted">Entradas no mês</span>
            <strong class="big income">{{ s.monthIncome | currency: 'BRL' }}</strong>
          </article>
          <article class="card">
            <span class="muted">Saídas no mês</span>
            <strong class="big expense">{{ s.monthExpenses | currency: 'BRL' }}</strong>
          </article>
        </div>

        <article class="card chart">
          <h2>Gastos por categoria</h2>
          <mb-category-bars [items]="s.expensesByCategory" />
        </article>
      } @else {
        <p class="muted">Carregando resumo…</p>
      }
    </section>
  `,
  styles: `
    .page { max-width: 960px; margin: 0 auto; padding: 2rem 0; display: grid; gap: 1.25rem; }
    .head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    h1 { margin: 0; font-size: 1.6rem; }
    h2 { margin: 0 0 1rem; font-size: 1.05rem; }
    .muted { color: #64748b; margin: .25rem 0 0; }
    .actions { display: flex; gap: .5rem; }
    .btn { padding: .6rem 1rem; border-radius: 8px; background: #0f766e; color: #fff; text-decoration: none; font-weight: 600; }
    .btn.secondary { background: #e2e8f0; color: #0f172a; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .card { background: #fff; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 12px rgb(0 0 0 / 6%); display: grid; gap: .35rem; }
    .big { font-size: 1.5rem; color: #0f172a; }
    .income { color: #15803d; }
    .expense { color: #b91c1c; }
    .chart { overflow-x: auto; }
  `,
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(FinanceApi);

  readonly summary = toSignal(this.api.summary());

  protected monthLabel(s: DashboardSummary): string {
    return new Date(s.year, s.month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }
}
