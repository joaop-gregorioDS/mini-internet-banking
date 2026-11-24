import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/notifications/toast.service';

@Component({
  selector: 'mb-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="toast.kind" role="status">
          <span>{{ toast.message }}</span>
          <button type="button" aria-label="Fechar" (click)="toasts.dismiss(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      display: grid;
      gap: 0.5rem;
      z-index: 1000;
      max-width: 360px;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      color: #fff;
      box-shadow: 0 4px 16px rgb(0 0 0 / 20%);
    }
    .toast.error {
      background: var(--error);
    }
    .toast.success {
      background: var(--success);
    }
    .toast.info {
      background: var(--foreground);
    }
    .toast button {
      margin-left: auto;
      background: none;
      border: 0;
      color: inherit;
      font-size: 1.1rem;
      cursor: pointer;
    }
  `,
})
export class ToastContainerComponent {
  protected readonly toasts = inject(ToastService);
}
