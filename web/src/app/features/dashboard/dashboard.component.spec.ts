import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DashboardComponent } from './dashboard.component';

const summary = {
  year: 2026,
  month: 11,
  balance: 4823.75,
  monthIncome: 0,
  monthExpenses: 176.25,
  expensesByCategory: [{ category: 'Food', total: 150.75 }],
};

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(DashboardComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('mostra o resumo quando a API responde', () => {
    fixture.detectChanges();
    http.expectOne('/api/dashboard/summary').flush(summary);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Alimentação');
    expect(fixture.nativeElement.querySelector('[data-testid="balance"]').textContent).toContain(
      '4,823.75',
    );
  });

  it('mostra erro com botão e tenta de novo ao clicar', () => {
    fixture.detectChanges();
    http.expectOne('/api/dashboard/summary').flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Não foi possível carregar o resumo agora.',
    );

    const retry = fixture.nativeElement.querySelector('button.btn') as HTMLButtonElement;
    retry.click();
    fixture.detectChanges();

    http.expectOne('/api/dashboard/summary').flush(summary);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="balance"]')).not.toBeNull();
  });
});
