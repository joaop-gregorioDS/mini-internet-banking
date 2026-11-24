import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, catchError, of, switchMap, tap } from 'rxjs';
import { CATEGORIES, CATEGORY_LABELS, PagedResult, TransactionCategory, TransactionItem } from '../../core/api/finance.models';
import { FinanceApi } from '../../core/api/finance-api.service';
import { parseApiDate } from '../../shared/utils/date';
import { signedAmount } from '../../shared/utils/money';

const PAGE_SIZE = 10;

@Component({
  selector: 'mb-statement',
  imports: [ReactiveFormsModule, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <header class="head">
        <h1>Extrato</h1>
        <a routerLink="/transfer" class="btn">Nova transferência</a>
      </header>

      <form class="filters card" [formGroup]="filters" novalidate>
        <label>
          De
          <input type="date" formControlName="from" />
        </label>
        <label>
          Até
          <input type="date" formControlName="to" />
        </label>
        <label>
          Categoria
          <select formControlName="category">
            <option value="">Todas</option>
            @for (c of categories; track c) {
              <option [value]="c">{{ labels[c] }}</option>
            }
          </select>
        </label>
      </form>

      <div class="card">
        @if (loading()) {
          <p class="muted">Carregando…</p>
        } @else if (result(); as r) {
          @if (r.items.length === 0) {
            <p class="muted">Nenhuma movimentação para os filtros escolhidos.</p>
          } @else {
            <ul class="list">
              @for (item of r.items; track item.id) {
                <li>
                  <div class="main">
                    <strong>{{ item.description }}</strong>
                    <span class="muted">
                      {{ item.type === 'Credit' ? 'De' : 'Para' }} {{ item.counterpartyName }}
                      · {{ labels[item.category] }} · {{ when(item) | date: 'dd/MM/yyyy HH:mm' }}
                    </span>
                  </div>
                  <span class="amount" [class.credit]="item.type === 'Credit'" [class.debit]="item.type === 'Debit'">
                    {{ signed(item) }}
                  </span>
                </li>
              }
            </ul>

            <footer class="pager">
              <button type="button" (click)="go(r.page - 1)" [disabled]="r.page <= 1">Anterior</button>
              <span class="muted">Página {{ r.page }} de {{ Math.max(1, r.totalPages) }}</span>
              <button type="button" (click)="go(r.page + 1)" [disabled]="r.page >= r.totalPages">Próxima</button>
            </footer>
          }
        } @else {
          <p class="muted">Não foi possível carregar o extrato.</p>
        }
      </div>
    </section>
  `,
  styles: `
    .page { max-width: 880px; margin: 2rem auto; display: grid; gap: 1rem; }
    .head { display: flex; justify-content: space-between; align-items: center; }
    h1 { margin: 0; font-size: 1.6rem; }
    .btn { padding: .6rem 1rem; border-radius: 8px; background: #0f766e; color: #fff; text-decoration: none; font-weight: 600; }
    .card { background: #fff; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 12px rgb(0 0 0 / 6%); }
    .filters { display: flex; gap: 1rem; flex-wrap: wrap; }
    .filters label { display: grid; gap: .3rem; font-size: .85rem; color: #334155; }
    input, select { padding: .5rem .65rem; border: 1px solid #cbd5e1; border-radius: 8px; font: inherit; }
    .list { list-style: none; margin: 0; padding: 0; }
    .list li { display: flex; justify-content: space-between; gap: 1rem; padding: .85rem 0; border-bottom: 1px solid #e2e8f0; }
    .list li:last-child { border-bottom: 0; }
    .main { display: grid; gap: .2rem; }
    .muted { color: #64748b; font-size: .9rem; }
    .amount { font-weight: 700; white-space: nowrap; }
    .credit { color: #15803d; }
    .debit { color: #b91c1c; }
    .pager { display: flex; justify-content: center; align-items: center; gap: 1rem; padding-top: 1rem; }
    .pager button { padding: .5rem .9rem; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; cursor: pointer; }
    .pager button:disabled { opacity: .4; cursor: default; }
  `,
})
export class StatementComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(FinanceApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = CATEGORIES;
  readonly labels = CATEGORY_LABELS;
  readonly Math = Math;

  readonly loading = signal(true);
  readonly result = signal<PagedResult<TransactionItem> | null>(null);

  private page = 1;
  private readonly reload$ = new Subject<void>();

  readonly filters = this.fb.nonNullable.group({
    from: [''],
    to: [''],
    category: [''],
  });

  constructor() {
    // switchMap cancela a requisição anterior quando um filtro muda antes de ela terminar.
    this.reload$
      .pipe(
        tap(() => this.loading.set(true)),
        switchMap(() =>
          this.api
            .statement({
              from: this.filters.controls.from.value || null,
              to: this.filters.controls.to.value || null,
              category: (this.filters.controls.category.value as TransactionCategory) || null,
              page: this.page,
              pageSize: PAGE_SIZE,
            })
            .pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((r) => {
        this.result.set(r);
        this.loading.set(false);
      });

    this.filters.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page = 1;
      this.reload$.next();
    });

    this.reload$.next();
  }

  go(page: number): void {
    this.page = page;
    this.reload$.next();
  }

  signed(item: TransactionItem): string {
    return signedAmount(item.type, item.amount);
  }

  when(item: TransactionItem): Date {
    return parseApiDate(item.createdAt);
  }
}
