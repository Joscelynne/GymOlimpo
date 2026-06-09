import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { UserService } from '../services/user.service';
import { GymService, PlanGym } from '../services/gym.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-planes',
  templateUrl: './planes.page.html',
  styleUrls: ['./planes.page.scss']
})
export class PlanesPage implements OnInit {
  perfil: any = null;
  planes: PlanGym[] = [];
  cargando = false;
  mensaje = '';
  detallesAbiertos: { [planId: string]: boolean } = {};

  constructor(
    private afAuth: AngularFireAuth,
    private userService: UserService,
    private gymService: GymService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.planes = this.gymService.getPlanesDisponibles();

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

  async seleccionarPlan(plan: PlanGym) {

    const alert = await this.alertController.create({
      header: 'Términos y Condiciones',

      cssClass: 'gym-alert',

      message:
        '✓ Vigencia de 1 mes desde la activación.\n' +
        '✓ Las sesiones no utilizadas expiran.\n' +
        '✓ No existe devolución por inasistencias.\n' +
        '✓ Cancelar una reserva implica perder la sesión.\n' +
        '✓ No existe compensación económica.',

      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Acepto y continuar',
          handler: async () => {
            await this.gymService.crearPagoPlan(plan);
            this.router.navigate(['/pagos']);
          }
        }
      ]
    });

    await alert.present();
  }

  tienePlanActivo(): boolean {
    return !!this.perfil?.planActivo && (this.perfil?.sesionesDisponibles ?? 0) > 0;
  }

  toggleDetalles(planId: string): void {
    this.detallesAbiertos[planId] = !this.detallesAbiertos[planId];
  }

  categoriaSeleccionada: 'presencial' | 'online' = 'presencial';
  get planesFiltrados(): PlanGym[] {

  if (this.categoriaSeleccionada === 'presencial') {

    return this.planes.filter(
      p => p.tipo === 'clase'
    );

  }

  return this.planes.filter(
    p => p.tipo === 'asesoria'
  );

}
}