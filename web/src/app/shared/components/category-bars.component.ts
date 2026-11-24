import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CATEGORY_LABELS, CategoryTotal } from '../../core/api/finance.models';
import { formatAmount } from '../utils/money';

export interface Bar {
  label: string;
  total: number;
  percent: number;
  y: number;
  width: number;
}

const ROW = 36;
const LABEL_WIDTH = 130;
const VALUE_WIDTH = 110;

/** Calcula as barras horizontais proporcionais ao maior gasto. Função pura, testável. */
export function computeBars(items: CategoryTotal[], chartWidth: number): Bar[] {
  if (items.length === 0) return [];
  const max = Math.max(...items.map((i) => i.total));
  const available = Math.max(40, chartWidth - LABEL_WIDTH - VALUE_WIDTH);

  return items.map((item, index) => {
    const percent = max === 0 ? 0 : item.total / max;
    return {
      label: CATEGORY_LABELS[item.category],
      total: item.total,
      percent,
      y: index * ROW,
      width: Math.max(2, Math.round(percent * available)),
    };
  });
}

@Component({
  selector: 'mb-category-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (bars().length === 0) {
      <p class="empty">Nenhum gasto neste mês.</p>
    } @else {
      <svg
        [attr.viewBox]="'0 0 ' + chartWidth + ' ' + height()"
        role="img"
        aria-label="Gastos por categoria no mês"
        width="100%"
      >
        @for (bar of bars(); track bar.label) {
          <g [attr.transform]="'translate(0,' + bar.y + ')'">
            <text x="0" y="22" class="label">{{ bar.label }}</text>
            <rect
              [attr.x]="labelWidth"
              y="8"
              height="18"
              rx="4"
              [attr.width]="bar.width"
              class="bar"
            />
            <text [attr.x]="labelWidth + bar.width + 8" y="22" class="value">
              {{ formatted(bar.total) }}
            </text>
          </g>
        }
      </svg>
    }
  `,
  styles: `
    svg {
      overflow: visible;
    }
    .label {
      font-size: 13px;
      fill: var(--foreground);
    }
    .value {
      font-size: 13px;
      fill: var(--foreground);
      font-weight: 600;
    }
    .bar {
      fill: var(--brand-primary);
    }
    .empty {
      color: var(--muted-foreground);
      margin: 0;
    }
  `,
})
export class CategoryBarsComponent {
  readonly items = input<CategoryTotal[]>([]);
  readonly chartWidth = 520;
  readonly labelWidth = LABEL_WIDTH;

  readonly bars = computed(() => computeBars(this.items(), this.chartWidth));
  readonly height = computed(() => Math.max(1, this.bars().length) * ROW);

  protected formatted(value: number): string {
    return `R$ ${formatAmount(value)}`;
  }
}
