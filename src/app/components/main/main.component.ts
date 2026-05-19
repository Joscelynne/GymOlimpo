import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { GymService } from 'src/app/services/gym.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  nombreUsuario   = '';
  reservasActivas = 0;
  pagosPendientes = 0;
  sesionesDisponibles = 0;
  diasVigencia    = 0;
  vigenciaFin     = '';

  constructor(
    public userService: UserService,
    private gymService: GymService,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe((user: any) => {
      if (!user) return;

      this.userService.getUserProfile(user.uid).subscribe((data: any) => {
        if (data) {
          this.nombreUsuario      = data.nombre || '';
          this.sesionesDisponibles = data.sesionesDisponibles ?? 0;
          this.vigenciaFin        = data.vigenciaFin || '';
          this.diasVigencia       = this.calcularDias(data.vigenciaFin);
        }
      });

      this.gymService.getReservasUsuario().subscribe(res => {
        this.reservasActivas = res.filter(r => r.estado !== 'cancelada').length;
      });

      this.gymService.getPagosUsuario().subscribe(pagos => {
        this.pagosPendientes = pagos.filter(p => p.estado === 'pendiente').length;
      });
    });
  }

  calcularDias(vigenciaFin: string): number {
    if (!vigenciaFin) return 0;
    const hoy  = new Date();
    const fin  = new Date(vigenciaFin);
    const diff = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  async onClick() {
    try {
      await this.userService.logout();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.log(error);
    }
  }
}