import { Component, OnInit } from '@angular/core';
import { GymService, Horario, Reserva } from '../services/gym.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { UserService } from '../services/user.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-reservas',
  templateUrl: './reservas.page.html',
  styleUrls: ['./reservas.page.scss']
})
export class ReservasPage implements OnInit {
  reservas: Reserva[] = [];
  horariosDisponibles: Horario[] = [];
  fechaSeleccionada = '';
  horarioSeleccionado: Horario | null = null;
  mensaje = '';
  cargando = false;
  today = new Date().toISOString();

  perfil: any = null;

  constructor(
    private gymService: GymService,
    private afAuth: AngularFireAuth,
    private userService: UserService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.gymService.getReservasUsuario().subscribe(data => {
      this.reservas = data;
    });

    this.afAuth.authState.subscribe((user: any) => {
      if (user) {
      this.userService.validarVigenciaPlan(user.uid);

      this.userService
        .getUserProfile(user.uid)
        .subscribe((data: any) => {

    this.perfil = data;
        });
      }
    });
  }

  onFechaChange(event: any) {
    this.fechaSeleccionada = event.detail.value?.split('T')[0] || '';
    this.horarioSeleccionado = null;
    this.mensaje = '';

    if (!this.fechaSeleccionada) {
      this.horariosDisponibles = [];
      return;
    }

    this.gymService.getHorariosDisponiblesPorFecha(this.fechaSeleccionada)
      .subscribe(horarios => {
        this.horariosDisponibles = horarios;
      });
  }

  seleccionarHorario(horario: Horario) {
    if (!this.tienePlanActivo()) {
      this.mensaje = 'Debes tener un plan activo para reservar.';
      return;
    }

    this.horarioSeleccionado = horario;
  }

  async guardar() {
    if (!this.tienePlanActivo()) {
      this.mensaje = 'Debes tener un plan activo para reservar.';
      return;
    }

    if ((this.perfil?.sesionesDisponibles ?? 0) <= 0) {
      this.mensaje = 'No tienes sesiones disponibles.';
      return;
    }

    if (!this.horarioSeleccionado) {
      this.mensaje = 'Debes seleccionar un horario disponible.';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    try {
      await this.gymService.crearReserva({
        clienteNombre: `${this.perfil?.nombre || ''} ${this.perfil?.apellido || ''}`.trim() || 'Cliente',
        horarioId: this.horarioSeleccionado.id!,
        fecha: this.horarioSeleccionado.fecha,
        hora: this.horarioSeleccionado.hora,
        estado: 'confirmada'
      });

      this.mensaje = 'Reserva confirmada correctamente.';
      this.horarioSeleccionado = null;

      this.gymService.getHorariosDisponiblesPorFecha(this.fechaSeleccionada)
        .subscribe(horarios => {
          this.horariosDisponibles = horarios;
        });
    } catch (error: any) {
      console.error(error);
      this.mensaje = error.message || 'No fue posible registrar la reserva.';
    } finally {
      this.cargando = false;
    }
  }

  async cancelar(id?: string) {
    if (!id) return;

    const alert = await this.alertController.create({
      header: 'Cancelar reserva',
      message:
        'Si cancelas esta reserva perderás la sesión utilizada. Esta acción no puede deshacerse.',
      buttons: [
        {
          text: 'Volver',
          role: 'cancel'
        },
        {
          text: 'Cancelar reserva',
          role: 'destructive',
          handler: async () => {

            try {

              await this.gymService.cancelarReserva(id);

              this.mensaje =
                'Reserva cancelada correctamente.';

            } catch (error: any) {

              console.error(error);

              this.mensaje =
                error.message ||
                'No fue posible cancelar la reserva.';
            }

          }
        }
      ]
    });

    await alert.present();
  }

  tienePlanActivo(): boolean {
    return !!this.perfil?.planActivo && (this.perfil?.sesionesDisponibles ?? 0) > 0;
  }
}