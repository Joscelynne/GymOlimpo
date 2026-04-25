import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  formLogin: FormGroup;
  errorMessage = '';
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.formLogin = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const { email, password } = this.formLogin.value;
      await this.userService.login({ email, password });
      this.redirectByRole();
    } catch (error) {
      console.log(error);
      this.errorMessage = 'Correo o contraseña incorrectos';
      this.loading = false;
    }
  }

  async loginGoogle() {
    this.loading = true;
    this.errorMessage = '';

    try {
      await this.userService.loginWithGoogle();
      this.redirectByRole();
    } catch (error) {
      console.log(error);
      this.errorMessage = 'No fue posible iniciar sesión con Google';
      this.loading = false;
    }
  }

  private redirectByRole() {
    this.userService.user$.pipe(
      filter(user => user !== undefined), // Wait for profile to load
      take(1) // Automatically unsubscribe to prevent memory leaks
    ).subscribe(user => {
      this.loading = false;
      if (user && user.rol === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/main']);
      }
    });
  }
}
