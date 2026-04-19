import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  formRegister: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private userService: UserService,
    private router: Router
  ) {
    this.formRegister = new FormGroup({
      rut: new FormControl('', [Validators.required, this.validateRutFormat]),
      nombre: new FormControl('', Validators.required),
      apellido: new FormControl('', Validators.required),
      telefono: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', Validators.required)
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
  this.formRegister.get('rut')?.valueChanges.subscribe(value => {
    if (!value) return;

    const formateado = this.formatearRut(value);

    this.formRegister.get('rut')?.setValue(formateado, {
      emitEvent: false
    });
  });
}

  async onSubmit() {
    if (this.formRegister.invalid) {
      this.formRegister.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.userService.register(this.formRegister.value);
      await this.router.navigate(['/main']);
    } catch (error) {
      console.error(error);
      this.errorMessage = 'No fue posible registrar el usuario. Revisa si el correo ya está en uso.';
    } finally {
      this.loading = false;
    }
  }

  validateRutFormat(control: AbstractControl): ValidationErrors | null {
    const rutRegex = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]$/;
    return rutRegex.test(control.value) ? null : { invalidRutFormat: true };
  }

  formatearRut(rut: string): string {
  rut = rut.replace(/[^0-9kK]/g, '').toUpperCase();

  if (rut.length < 2) return rut;

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);

  let cuerpoFormateado = '';
  let i = 0;

  for (let j = cuerpo.length - 1; j >= 0; j--) {
    cuerpoFormateado = cuerpo[j] + cuerpoFormateado;
    i++;
    if (i % 3 === 0 && j !== 0) {
      cuerpoFormateado = '.' + cuerpoFormateado;
    }
  }

  return `${cuerpoFormateado}-${dv}`;
}

  passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}