import { Component } from '@angular/core';
import { UserService } from './services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Gym Olimpo';
  appPages = [
    { title: 'Inicio', url: '/main', icon: 'home' },
    { title: 'Perfil', url: '/perfil', icon: 'person-circle' },
    { title: 'Reservas', url: '/reservas', icon: 'calendar' },
    { title: 'Horarios', url: '/horarios', icon: 'time' },
    { title: 'Planes', url: '/planes', icon: 'document-text' },
    { title: 'Pagos', url: '/pagos', icon: 'card' },
    { title: 'Administración', url: '/admin', icon: 'settings' }
  ];

  constructor(private userService: UserService, private router: Router) {}

  logout() {
    this.userService.logout().then(() => this.router.navigate(['/login'])).catch(error => {
      console.error('Error al cerrar sesión:', error);
    });
  }
}
