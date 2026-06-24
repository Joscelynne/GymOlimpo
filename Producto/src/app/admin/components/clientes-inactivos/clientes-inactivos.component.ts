import { Component, Input } from '@angular/core';
import { ClienteInactivo } from '../../admin.models';

@Component({
  selector: 'app-clientes-inactivos',
  templateUrl: './clientes-inactivos.component.html',
  styleUrls: ['./clientes-inactivos.component.scss']
})
export class ClientesInactivosComponent {
  @Input() clientes: ClienteInactivo[] = [];
  @Input() error: string | null = null;

  formatLastSession(dateStr: string | null): string {
    if (!dateStr) return 'Sin sesiones registradas';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    } catch {
      return dateStr;
    }
  }

  trackById(_: number, item: ClienteInactivo): string {
    return item.uid;
  }
}
