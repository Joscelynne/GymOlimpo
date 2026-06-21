import { Component } from '@angular/core';
import { UserService } from './services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Gym Olympo';

  basePages = [
    { title: 'Inicio',    url: '/main',     icon: 'home'          },
    { title: 'Reservas',  url: '/reservas', icon: 'calendar'      },
    { title: 'Planes',    url: '/planes',   icon: 'document-text' },
    { title: 'Pagos',     url: '/pagos',    icon: 'card'          },
    { title: 'Mi Perfil', url: '/perfil',   icon: 'person-circle' },
  ];

  adminPages = [
    { title: 'Administración', url: '/admin', icon: 'settings' },
    { title: 'Planes Personalizados', url: '/admin/planes', icon: 'document-text' }
  ];

  constructor(public userService: UserService, private router: Router) {}

  logout() {
    this.userService.logout()
      .then(() => this.router.navigate(['/login']))
      .catch(error => console.error('Error al cerrar sesión:', error));
  }

  getUserInitials(user: any): string {
    if (user?.nombre) {
      const parts = user.nombre.trim().split(' ');
      return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
    }
    return (user?.email?.[0] || '?').toUpperCase();
  }
}
