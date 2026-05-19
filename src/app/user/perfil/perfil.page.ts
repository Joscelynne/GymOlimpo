import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { UserService } from 'src/app/services/user.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { GymService } from 'src/app/services/gym.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss']
})
export class PerfilPage implements OnInit {
  user: any = null;
  userData: any = null;
  cargando = true;
  errorMensaje = '';

  reservas: any[] = [];
  pagosPendientes = 0;

  constructor(
    private afAuth: AngularFireAuth,
    private userService: UserService,
    private gymService: GymService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.afAuth.authState.subscribe({
      next: async (user: any) => {
        this.user = user;

        if (!this.user) {
          this.userData = null;
          this.cargando = false;
          this.errorMensaje = 'No hay sesión iniciada.';
          return;
        }

        this.userService.getUserProfile(this.user.uid).subscribe({
          next: (doc: any) => {
            console.log('Perfil Firestore:', doc);

            if (doc) {
              this.userData = doc;
              this.errorMensaje = '';
            }

            this.cargando = false;
          },
          error: (error) => {
            console.error('Error cargando perfil:', error);
            this.userData = null;
            this.cargando = false;
            this.errorMensaje = 'Ocurrió un error al cargar el perfil.';
          }
        });

        this.gymService.getReservasUsuario().subscribe(res => {
          this.reservas = res.filter(r => r.estado !== 'cancelada');
        });

        this.gymService.getPagosUsuario().subscribe(pagos => {
          this.pagosPendientes = pagos.filter(p => p.estado === 'pendiente').length;
        });
      },
      error: (error) => {
        console.error('Error authState:', error);
        this.user = null;
        this.userData = null;
        this.cargando = false;
        this.errorMensaje = 'No fue posible obtener la sesión del usuario.';
      }
    });
  }

  async cerrarSesion() {
    await this.userService.logout();
    await this.router.navigate(['/login']);
  }

  getInitials(): string {
    const n = this.userData?.nombre?.trim() || '';
    const a = this.userData?.apellido?.trim() || '';
    if (n && a) return (n[0] + a[0]).toUpperCase();
    if (n) return n.substring(0, 2).toUpperCase();
    return (this.user?.email?.[0] || '?').toUpperCase();
  }

  async confirmarCierreSesion() {
    const alert = await this.alertController.create({
      header: 'Confirmar cierre de sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'secondary' },
        { text: 'Aceptar', handler: () => void this.cerrarSesion() }
      ]
    });

    await alert.present();
  }
}