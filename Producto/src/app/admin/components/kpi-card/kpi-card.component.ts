import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { KpiCardConfig } from '../../admin.models';
import { formatMonto } from '../../admin.utils';

@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss']
})
export class KpiCardComponent implements OnChanges {
  @Input() config!: KpiCardConfig;

  displayValue = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.displayValue = this.formatValue();
    }
  }

  private formatValue(): string {
    if (this.config.loading) return '';
    const val = this.config.value;
    switch (this.config.formato) {
      case 'moneda':
        return formatMonto(Number(val));
      case 'porcentaje':
        return `${val}%`;
      default:
        return String(val);
    }
  }
}
