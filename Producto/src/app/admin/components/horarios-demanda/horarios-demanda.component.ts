import { Component, Input } from '@angular/core';
import { HorarioDemanda } from '../../admin.models';

@Component({
  selector: 'app-horarios-demanda',
  templateUrl: './horarios-demanda.component.html',
  styleUrls: ['./horarios-demanda.component.scss']
})
export class HorariosDemandaComponent {
  @Input() horarios: HorarioDemanda[] = [];
  @Input() error: string | null = null;

  badgeClass(nivel: string): string {
    switch (nivel) {
      case 'alta': return 'badge-red';
      case 'media': return 'badge-orange';
      default: return 'badge-gray';
    }
  }

  badgeText(nivel: string): string {
    switch (nivel) {
      case 'alta': return 'Alta demanda';
      case 'media': return 'Demanda media';
      default: return 'Baja demanda';
    }
  }

  barClass(nivel: string): string {
    switch (nivel) {
      case 'alta': return 'bar-red';
      case 'media': return 'bar-orange';
      default: return 'bar-gray';
    }
  }

  trackByHora(_: number, item: HorarioDemanda): string {
    return item.hora;
  }
}
