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
    .toasts { position: fixed; right: 1rem; bottom: 1rem; display: grid; gap: .5rem; z-index: 1000; max-width: 360px; }
    .toast { display: flex; align-items: flex-start; gap: .75rem; padding: .75rem 1rem; border-radius: 10px; color: #fff; box-shadow: 0 4px 16px rgb(0 0 0 / 20%); }
    .toast.error { background: #b91c1c; }
    .toast.success { background: #15803d; }
    .toast.info { background: #334155; }
    .toast button { margin-left: auto; background: none; border: 0; color: inherit; font-size: 1.1rem; cursor: pointer; }
  `,
})
export class ToastContainerComponent {
  protected readonly toasts = inject(ToastService);
}
