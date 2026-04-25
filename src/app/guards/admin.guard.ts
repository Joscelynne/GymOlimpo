import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap, filter } from 'rxjs/operators';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(private userService: UserService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.userService.user$.pipe(
      // Wait until the user$ observable emits something other than null (if it's still initializing).
      // If we want to strictly protect and we might have null because they aren't logged in,
      // we should handle it. Actually, AuthGuard handles the "not logged in" part. 
      // But we can just use take(1) to avoid memory leaks.
      // We filter out 'undefined' which means the profile is still loading from Firestore
      filter(user => user !== undefined),
      take(1),
      map(user => {
        if (user && user.rol === 'admin') {
          return true;
        }
        return false;
      }),
      tap(isAdmin => {
        if (!isAdmin) {
          this.router.navigate(['/main']);
        }
      })
    );
  }
}
