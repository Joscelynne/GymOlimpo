import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Reserva } from '../../../services/gym.service';

@Component({
  selector: 'app-reservas-table',
  templateUrl: './reservas-table.component.html',
  styleUrls: ['./reservas-table.component.scss']
})
export class ReservasTableComponent {
  @Input() reservas: Reserva[] = [];
  @Input() error: string | null = null;

  @Output() confirmarAsistencia = new EventEmitter<string>();
  @Output() cancelarReserva = new EventEmitter<Reserva>();

  disabledButtons = new Set<string>();

  onConfirmar(reserva: Reserva): void {
    if (!reserva.id || this.disabledButtons.has(reserva.id)) return;
    this.disabledButtons.add(reserva.id);
    this.confirmarAsistencia.emit(reserva.id);
  }

  onCancelar(reserva: Reserva): void {
    this.cancelarReserva.emit(reserva);
  }

  enableButton(id: string): void {
    this.disabledButtons.delete(id);
  }

  badgeClass(estado: string): string {
    switch (estado) {
      case 'confirmada': return 'badge-green';
      case 'pendiente_pago': return 'badge-orange';
      case 'cancelada': return 'badge-red';
      default: return 'badge-gray';
    }
  }

  trackById(_: number, r: Reserva): string {
    return r.id || '';
  }
}
