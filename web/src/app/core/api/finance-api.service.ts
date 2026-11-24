import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AccountInfo,
  DashboardSummary,
  PagedResult,
  StatementFilter,
  TransactionItem,
  TransferPayload,
  TransferResult,
} from './finance.models';

/** Monta os query params do extrato, ignorando filtros vazios. Função pura para facilitar testes. */
export function buildStatementParams(filter: StatementFilter): HttpParams {
  let params = new HttpParams()
    .set('page', String(filter.page ?? 1))
    .set('pageSize', String(filter.pageSize ?? 10));

  if (filter.from) params = params.set('from', filter.from);
  if (filter.to) params = params.set('to', filter.to);
  if (filter.category) params = params.set('category', filter.category);

  return params;
}

@Injectable({ providedIn: 'root' })
export class FinanceApi {
  private readonly http = inject(HttpClient);

  account(): Observable<AccountInfo> {
    return this.http.get<AccountInfo>('/api/accounts/me');
  }

  summary(year?: number, month?: number): Observable<DashboardSummary> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    if (month) params = params.set('month', month);
    return this.http.get<DashboardSummary>('/api/dashboard/summary', { params });
  }

  transfer(payload: TransferPayload): Observable<TransferResult> {
    return this.http.post<TransferResult>('/api/transfers', payload);
  }

  statement(filter: StatementFilter): Observable<PagedResult<TransactionItem>> {
    return this.http.get<PagedResult<TransactionItem>>('/api/transactions', {
      params: buildStatementParams(filter),
    });
  }
}
