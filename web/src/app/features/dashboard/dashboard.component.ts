import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FinanceApi } from '../../core/api/finance-api.service';
import { DashboardSummary } from '../../core/api/finance.models';
import { CategoryBarsComponent } from '../../shared/components/category-bars.component';

type SummaryState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: DashboardSummary };

@Component({
  selector: 'mb-dashboard',
  imports: [CurrencyPipe, RouterLink, CategoryBarsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      @let st = state();
      <header class="head">
        <div>
          <h1>Olá, {{ auth.user()?.name }}</h1>
          @if (st.status === 'ready') {
            <p class="muted">Resumo de {{ monthLabel(st.data) }}</p>
          }
        </div>
        <div class="actions">
          <a routerLink="/transfer" class="btn">Nova transferência</a>
          <a routerLink="/statement" class="btn secondary">Ver extrato</a>
        </div>
      </header>

      @if (st.status === 'ready') {
        <div class="cards">
          <article class="card">
            <span class="muted">Saldo atual</span>
            <strong class="big" data-testid="balance">{{
              st.data.balance | currency: 'BRL'
            }}</strong>
          </article>
          <article class="card">
            <span class="muted">Entradas no mês</span>
            <strong class="big income">{{ st.data.monthIncome | currency: 'BRL' }}</strong>
          </article>
          <article class="card">
            <span class="muted">Saídas no mês</span>
            <strong class="big expense">{{ st.data.monthExpenses | currency: 'BRL' }}</strong>
          </article>
        </div>

        <article class="card chart">
          <h2>Gastos por categoria</h2>
          <mb-category-bars [items]="st.data.expensesByCategory" />
        </article>
      } @else if (st.status === 'error') {
        <article class="card">
          <p>Não foi possível carregar o resumo agora.</p>
          <button type="button" class="btn" (click)="retry()">Tentar de novo</button>
        </article>
      } @else {
        <p class="muted">Carregando resumo…</p>
      }
    </section>
  `,
  styles: `
    .page {
      max-width: 960px;
      margin: 0 auto;
      padding: 2rem 0;
      display: grid;
      gap: 1.25rem;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    h1 {
      margin: 0;
      font-size: 1.6rem;
    }
    h2 {
      margin: 0 0 1rem;
      font-size: 1.05rem;
    }
    .muted {
      color: var(--muted-foreground);
      margin: 0.25rem 0 0;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn {
      padding: 0.6rem 1rem;
      border: 0;
      border-radius: 999px;
      background: var(--brand-gradient);
      color: #fff;
      text-decoration: none;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .btn.secondary {
      background: var(--border);
      color: var(--foreground);
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .card {
      background: #fff;
      border-radius: 24px;
      padding: 1.25rem;
      box-shadow: 0 12px 32px rgb(41 37 42 / 10%);
      display: grid;
      gap: 0.35rem;
    }
    .big {
      font-size: 1.5rem;
      color: var(--foreground);
    }
    .income {
      color: var(--success);
    }
    .expense {
      color: var(--error);
    }
    .chart {
      overflow-x: auto;
    }
  `,
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(FinanceApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<SummaryState>({ status: 'loading' });

  constructor() {
    this.load();
  }

  retry(): void {
    this.load();
  }

  private load(): void {
    this.state.set({ status: 'loading' });
    this.api
      .summary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.state.set({ status: 'ready', data }),
        error: () => this.state.set({ status: 'error' }),
      });
  }

  protected monthLabel(s: DashboardSummary): string {
    return new Date(s.year, s.month - 1, 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  }
}
