import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GymService, Horario, Reserva } from '../.././../services/gym.service';
import { BloqueCalendario } from '../../admin.models';
import { calcularOcupacion, clasificarBloque, fechaHoy } from '../../admin.utils';

@Component({
  selector: 'app-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss']
})
export class CalendarViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  selectedDate = fechaHoy();
  bloques: BloqueCalendario[] = [];
  loading = true;
  error: string | null = null;

  constructor(private gym: GymService) {}

  ngOnInit(): void {
    this.loadDate(this.selectedDate);
  }

  loadDate(fecha: string): void {
    this.loading = true;
    this.error = null;

    this.gym.getHorariosPorFecha(fecha).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (horarios: Horario[]) => {
        // Get reservas for this date
        this.gym.getReservasPorFecha(fecha).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (reservas: Reserva[]) => {
            this.bloques = horarios.map(h => {
              const pct = calcularOcupacion(h.cupos, h.cuposDisponibles ?? 0);
              const clientesEnBloque = reservas
                .filter(r => r.hora === h.hora && r.estado === 'confirmada')
                .map(r => r.clienteNombre);
              return {
                horarioId: h.id || '',
                hora: h.hora,
                cupos: h.cupos,
                cuposDisponibles: h.cuposDisponibles ?? 0,
                porcentajeOcupacion: pct,
                estado: clasificarBloque(pct),
                clientes: clientesEnBloque
              };
            });
            this.loading = false;
          },
          error: () => {
            this.error = `No se pudieron cargar los horarios para ${fecha}`;
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = `No se pudieron cargar los horarios para ${fecha}`;
        this.loading = false;
      }
    });
  }

  prevDay(): void {
    const d = new Date(this.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    this.selectedDate = this.toStr(d);
    this.loadDate(this.selectedDate);
  }

  nextDay(): void {
    const d = new Date(this.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    this.selectedDate = this.toStr(d);
    this.loadDate(this.selectedDate);
  }

  private toStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  isToday(): boolean {
    return this.selectedDate === fechaHoy();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
