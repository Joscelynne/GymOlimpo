import { Component, Input } from '@angular/core';
import { PagoAdmin } from '../../admin.models';
import { formatMonto } from '../../admin.utils';

@Component({
  selector: 'app-pagos-panel',
  templateUrl: './pagos-panel.component.html',
  styleUrls: ['./pagos-panel.component.scss']
})
export class PagosPanelComponent {
  @Input() pagos: PagoAdmin[] = [];
  @Input() error: string | null = null;

  formatPrice(monto: number): string {
    return formatMonto(monto);
  }

  badgeClass(estado: string): string {
    switch (estado) {
      case 'validado': return 'badge-green';
      case 'pendiente': return 'badge-orange';
      case 'cancelado': return 'badge-red';
      default: return 'badge-gray';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      // Format to simple localized date like DD/MM
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    } catch {
      return dateStr;
    }
  }

  trackById(_: number, pago: PagoAdmin): string {
    return pago.id;
  }
}
