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
  nombreUsuario = '';

  constructor(
    private userService: UserService,
    private gymService: GymService,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.afAuth.authState.subscribe((user: any) => {
      if (user) {
        this.userService.getUserProfile(user.uid).subscribe((data: any) => {
          if (data) {
            this.nombreUsuario = data.nombre || '';
          }
        });
      }
    });
  }

  async onClick() {
    try {
      await this.userService.logout();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.log(error);
    }
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
}