import { Component, OnInit, OnDestroy } from '@angular/core';
import { GymService, Horario, Reserva } from '../services/gym.service';
import { Subscription } from 'rxjs';

@Component({ selector: 'app-admin', templateUrl: './admin.page.html', styleUrls: ['./admin.page.scss'] })
export class AdminPage implements OnInit, OnDestroy {
  resumen = { reservas: 0, pagosPendientes: 0, horarios: 0 };

  today = new Date();
  fechaHoy = this.formatDate(this.today);

  horariosHoy: Horario[] = [];
  reservasHoy: Reserva[] = [];
  reservasPendientePago: Reserva[] = [];
  horariosIndex: { [key: string]: Horario } = {};

  pagosPendientes = 0;
  bloquesAgotados = 0;
  cuposTotalesHoy = 0;
  cuposOcupadosHoy = 0;

  recientes: Reserva[] = [];

  private subs: Subscription[] = [];

  constructor(private gymService: GymService) {}

  ngOnInit() {
    this.subs.push(this.gymService.getResumenAdmin().subscribe(data => this.resumen = data));

    this.subs.push(this.gymService.getHorarios().subscribe(hs => {
      this.horariosHoy = hs.filter(h => h.fecha === this.fechaHoy).sort((a,b) => a.hora.localeCompare(b.hora));
      // build index for fast lookup from templates
      this.horariosIndex = {};
      for (const h of this.horariosHoy) {
        this.horariosIndex[`${h.fecha}|${h.hora}`] = h;
      }
      this.calculateCupos();
    }));

    this.subs.push(this.gymService.getReservasPorFecha(this.fechaHoy).subscribe(rs => {
      this.reservasHoy = rs;
      // precompute pendiente_pago list used by template (avoids arrow funcs in template)
      this.reservasPendientePago = this.reservasHoy.filter(r => r.estado === 'pendiente_pago');
      this.calculateCupos();
    }));

    this.subs.push(this.gymService.getPagosPendientes().subscribe(p => this.pagosPendientes = p.length));

    this.subs.push(this.gymService.getReservasRecientes(50).subscribe(r => this.recientes = r));
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  private calculateCupos() {
    let total = 0;
    let ocupados = 0;
    let agotados = 0;

    for (const h of this.horariosHoy) {
      total += h.cupos;
      const ocup = (h.cupos - (h.cuposDisponibles ?? 0));
      ocupados += ocup;
      if ((h.cupos - (h.cuposDisponibles ?? 0)) >= h.cupos) agotados++;
    }

    this.cuposTotalesHoy = total;
    this.cuposOcupadosHoy = ocupados;
    this.bloquesAgotados = agotados;
  }

  formatDate(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async generarHorarios() {
    try {
      await this.gymService.generarHorariosProximos30Dias();
      alert('Horarios generados correctamente');
    } catch (error) {
      console.error(error);
      alert('Error al generar horarios');
    }
  }

  async confirmarAsistencia(reservaId?: string) {
    if (!reservaId) return;
    try {
      await this.gymService.confirmarAsistencia(reservaId);
      alert('Asistencia registrada');
    } catch (error) {
      console.error(error);
      alert('Error al registrar asistencia');
    }
  }

  async cancelarReserva(id?: string) {
    if (!id) return;
    if (!confirm('¿Confirmas cancelar esta reserva?')) return;
    try {
      await this.gymService.cancelarReserva(id);
      alert('Reserva cancelada y cupo liberado');
    } catch (error) {
      console.error(error);
      alert('Error al cancelar la reserva');
    }
  }
}
