import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

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
      await this.router.navigate(['/main']);
    } catch (error) {
      console.log(error);
      this.errorMessage = 'Correo o contraseña incorrectos';
    } finally {
      this.loading = false;
    }
  }

  async loginGoogle() {
  this.loading = true;
  this.errorMessage = '';

  try {
    await this.userService.loginWithGoogle();
    await this.router.navigate(['/main']);
  } catch (error) {
    console.log(error);
    this.errorMessage = 'No fue posible iniciar sesión con Google';
  } finally {
    this.loading = false;
  }
}
}
