import { Injectable, signal } from '@angular/core';

export type ToastKind = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly toastsSignal = signal<Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, kind: ToastKind = 'info', durationMs = 5000): void {
    const id = this.nextId++;
    this.toastsSignal.update((list) => [...list, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  error(message: string): void {
    this.show(message, 'error', 6000);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  dismiss(id: number): void {
    this.toastsSignal.update((list) => list.filter((t) => t.id !== id));
  }
}
