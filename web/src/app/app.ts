import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Toasts ficam na raiz para aparecer também nas telas públicas (login e cadastro).
  template: '<router-outlet /><mb-toast-container />',
})
export class App {}
