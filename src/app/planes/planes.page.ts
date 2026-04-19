import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { UserService } from '../services/user.service';
import { GymService, PlanGym } from '../services/gym.service';

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

  constructor(
    private afAuth: AngularFireAuth,
    private userService: UserService,
    private gymService: GymService,
    private router: Router
  ) {}

  ngOnInit() {
    this.planes = this.gymService.getPlanesDisponibles();

    this.afAuth.authState.subscribe((user: any) => {
      if (user) {
        this.userService.getUserProfile(user.uid).subscribe((data: any) => {
          this.perfil = data;
        });
      }
    });
  }

  async seleccionarPlan(plan: PlanGym) {
    this.cargando = true;
    this.mensaje = '';

    try {
      await this.gymService.crearPagoPlan(plan);
      this.mensaje = `Se generó el pago pendiente para el plan "${plan.nombre}".`;
      await this.router.navigate(['/pagos']);
    } catch (error: any) {
      console.error(error);
      this.mensaje = error.message || 'No fue posible seleccionar el plan.';
    } finally {
      this.cargando = false;
    }
  }

  tienePlanActivo(): boolean {
    return !!this.perfil?.planActivo && (this.perfil?.sesionesDisponibles ?? 0) > 0;
  }
}