import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Subject, combineLatest, of } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';
import { GymService, Reserva } from '../services/gym.service';
import { DashboardState, initialDashboardState } from './admin.models';
import {
  fechaHoy,
  fechaOffset,
  calcularOcupacion,
  calcularKpis,
  calcularAlertas,
  agruparReservasPorDia,
  calcularHorariosDemanda,
  calcularPlanesPorVencer,
  calcularClientesInactivos,
  mapearPagosAdmin
} from './admin.utils';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss']
})
export class AdminPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  state: DashboardState = initialDashboardState();
  generatingHorarios = false;

  constructor(
    private gymService: GymService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.suscribirStreams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private suscribirStreams(): void {
    const hoy = fechaHoy();
    const hace7Dias = fechaOffset(-7);

    this.state.cargando = true;
    this.state.error = null;

    // Stream 1: KPIs base
    combineLatest([
      this.gymService.getClientesActivos().pipe(catchError(() => of([]))),
      this.gymService.getReservasPorFecha(hoy).pipe(catchError(() => of([]))),
      this.gymService.getPagosPendientes().pipe(catchError(() => of([]))),
      this.gymService.getUsuariosConVigencia().pipe(catchError(() => of([]))),
      this.gymService.getHorarios().pipe(catchError(() => of([]))),
      this.gymService.getPagosValidados().pipe(catchError(() => of([])))
    ]).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.state.error = 'Error al cargar KPIs del dashboard.';
        return of([[], [], [], [], [], []]);
      })
    ).subscribe(([clientes, reservasHoy, pagos, usuarios, horarios, pagosValidados]) => {
      this.state.kpis = calcularKpis(clientes, reservasHoy, pagos, usuarios, horarios, pagosValidados, hoy);
      this.state.cargando = false;
    });

    // Stream 2: Alertas
    combineLatest([
      this.gymService.getPagosPendientes().pipe(catchError(() => of([]))),
      this.gymService.getUsuariosConVigencia().pipe(catchError(() => of([]))),
      this.gymService.getHorariosPorFecha(hoy).pipe(catchError(() => of([]))),
      this.gymService.getReservasRecientes(500).pipe(catchError(() => of([])))
    ]).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.state.error = 'Error al calcular alertas del sistema.';
        return of([[], [], [], []]);
      })
    ).subscribe(([pagos, usuarios, horariosHoy, reservas]) => {
      this.state.alertas = calcularAlertas(pagos, usuarios, horariosHoy, reservas, hoy);
    });

    // Stream 3a: Gráfico de ocupación (barras verticales)
    this.gymService.getHorariosPorFecha(hoy).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.state.error = 'Error al cargar horarios de hoy para el gráfico.';
        return of([]);
      })
    ).subscribe(horarios => {
      this.state.chartOcupacion = horarios.map(h => ({
        label: h.hora,
        value: calcularOcupacion(h.cupos, h.cuposDisponibles)
      }));
    });

    // Stream 3b: Gráfico de reservas últimos 7 días (línea + área)
    this.gymService.getReservasPorRango(hace7Dias, hoy).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.state.error = 'Error al cargar reservas de la semana para el gráfico.';
        return of([]);
      })
    ).subscribe(reservas => {
      this.state.chartReservasSemana = agruparReservasPorDia(reservas, hace7Dias, hoy);
    });

    // Stream 3c & 10.4: Gráfico barras horizontales (top 5 demanda) & horariosDemanda
    this.gymService.getHorarios().pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.state.error = 'Error al cargar ranking de demanda de horarios.';
        return of([]);
      })
    ).subscribe(horarios => {
      this.state.horariosDemanda = calcularHorariosDemanda(horarios);
      this.state.chartTopHorarios = this.state.horariosDemanda
        .slice(0, 5)
        .map(h => ({ label: h.hora, value: h.porcentajePromedio }));
    });

    // Stream 4: Tabla de reservas recientes (50)
    this.gymService.getReservasRecientes(50).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.state.error = 'Error al cargar las reservas recientes.';
        return of([]);
      })
    ).subscribe(reservas => {
      this.state.reservasRecientes = reservas;
    });

    // Stream 5: Pagos recientes (10)
    this.gymService.getPagosRecientes(10).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.state.error = 'Error al cargar los pagos recientes.';
        return of([]);
      })
    ).subscribe(pagos => {
      this.state.pagosRecientes = mapearPagosAdmin(pagos);
    });

    // Stream 6: Clientes inactivos
    combineLatest([
      this.gymService.getClientesConPlanActivo().pipe(catchError(() => of([]))),
      this.gymService.getReservasRecientes(500).pipe(catchError(() => of([])))
    ]).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.state.error = 'Error al calcular los clientes inactivos.';
        return of([[], []]);
      })
    ).subscribe(([clientes, reservas]) => {
      this.state.clientesInactivos = calcularClientesInactivos(clientes, reservas, hoy);
    });

    // Stream 7: Planes por vencer
    this.gymService.getUsuariosConVigencia().pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.state.error = 'Error al cargar planes por vencer.';
        return of([]);
      })
    ).subscribe(usuarios => {
      this.state.planesPorVencer = calcularPlanesPorVencer(usuarios, hoy);
    });
  }

  // Reload Planes Panel
  reloadPlanes(): void {
    const hoy = fechaHoy();
    this.gymService.getUsuariosConVigencia().pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.showErrorToast('No se pudieron recargar los planes por vencer.');
        return of([]);
      })
    ).subscribe(usuarios => {
      this.state.planesPorVencer = calcularPlanesPorVencer(usuarios, hoy);
    });
  }

  // Action: Generar Horarios
  async onGenerarHorarios(): Promise<void> {
    if (this.generatingHorarios) return;
    this.generatingHorarios = true;

    try {
      await this.gymService.generarHorariosProximos30Dias();
      this.showToast('Horarios para los próximos 30 días generados con éxito.', 'success');
    } catch (err: any) {
      console.error(err);
      this.showErrorToast(err?.message || 'Error al generar los horarios de los próximos 30 días.');
    } finally {
      this.generatingHorarios = false;
    }
  }

  // Action: Confirmar Asistencia
  async onConfirmarAsistencia(reservaId: string, reservasTableComp: any): Promise<void> {
    try {
      await this.gymService.confirmarAsistencia(reservaId);
      this.showToast('Asistencia registrada correctamente.', 'success');
    } catch (err: any) {
      console.error(err);
      this.showErrorToast(err?.message || 'Error al registrar la asistencia.');
      if (reservasTableComp) {
        reservasTableComp.enableButton(reservaId);
      }
    }
  }

  // Action: Cancelar Reserva
  async onCancelarReserva(reserva: Reserva): Promise<void> {
    if (!reserva.id) return;

    const confirmed = await this.confirmarCancelacion(reserva);
    if (!confirmed) return;

    try {
      await this.gymService.cancelarReserva(reserva.id);
      this.showToast(`La reserva de ${reserva.clienteNombre} ha sido cancelada.`, 'success');
    } catch (err: any) {
      console.error(err);
      this.showErrorToast(err?.message || 'Error al cancelar la reserva.');
    }
  }

  // Toast / Alert UI controllers
  private async showToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 5000,
      color,
      position: 'bottom',
      buttons: [{ role: 'cancel', icon: 'close-outline' }]
    });
    await toast.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 10000,
      color: 'danger',
      position: 'bottom',
      buttons: [{ role: 'cancel', text: 'Cerrar' }]
    });
    await toast.present();
  }

  private async confirmarCancelacion(reserva: Reserva): Promise<boolean> {
    return new Promise(async resolve => {
      const alert = await this.alertCtrl.create({
        header: 'Cancelar Reserva',
        message: `¿Confirmas cancelar la reserva de <strong>${reserva.clienteNombre}</strong> para el ${reserva.fecha} a las ${reserva.hora}?`,
        cssClass: 'gym-alert',
        buttons: [
          {
            text: 'No',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Sí, cancelar',
            role: 'confirm',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }
}
