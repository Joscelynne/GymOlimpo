import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const user = await this.afAuth.currentUser;

    if (!user) {
      await this.router.navigate(['/login']);
      return false;
    }

    const path = route.routeConfig?.path;

    // Estas rutas no requieren perfil completo
    if (path === 'perfil' || path === 'completar-perfil') {
      return true;
    }

    // Verificar si tiene RUT y teléfono (solo para usuarios registrados vía Google)
    const doc = await this.firestore.collection('users').doc(user.uid).ref.get();
    const data: any = doc.data();

    if (data?.provider === 'google' && (!data?.rut || !data?.telefono)) {
      await this.router.navigate(['/completar-perfil']);
      return false;
    }

    return true;
  }
}