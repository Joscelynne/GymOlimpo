import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { UserService } from 'src/app/services/user.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { GymService } from 'src/app/services/gym.service';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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

  profileForm: FormGroup;
  savingProfile = false;
  formMessage = '';

  constructor(
    private afAuth: AngularFireAuth,
    private userService: UserService,
    private gymService: GymService,
    private alertController: AlertController,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      rut: ['', [Validators.required, this.validateRutFormat]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', this.optionalMinLengthValidator(8)],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });
  }

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
              this.formMessage = '';
              this.patchProfileForm();
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

  private patchProfileForm() {
    this.profileForm.patchValue({
      rut: this.userData?.rut || '',
      nombre: this.userData?.nombre || '',
      apellido: this.userData?.apellido || '',
      telefono: this.userData?.telefono || '',
      email: this.userData?.email || this.user?.email || ''
    });
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    if (!this.user) {
      this.errorMensaje = 'No hay usuario autenticado.';
      return;
    }

    this.savingProfile = true;
    this.formMessage = '';
    this.errorMensaje = '';

    try {
      const { rut, nombre, apellido, telefono, email, newPassword } = this.profileForm.value;

      await this.userService.updateProfile(this.user.uid, {
        rut,
        nombre,
        apellido,
        telefono,
        email,
        provider: this.userData?.provider || this.user.providerData?.[0]?.providerId || 'password'
      });

      if (this.user.email !== email) {
        await this.userService.updateEmail(email);
      }

      if (newPassword) {
        await this.userService.updatePassword(newPassword);
      }

      this.formMessage = 'Perfil actualizado correctamente.';
      this.profileForm.get('newPassword')?.reset('');
      this.profileForm.get('confirmPassword')?.reset('');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      this.errorMensaje = 'No fue posible actualizar el perfil. Revisa tus datos e intenta de nuevo.';
    } finally {
      this.savingProfile = false;
    }
  }

  validateRutFormat(control: AbstractControl): ValidationErrors | null {
    const rutRegex = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]$/;
    return rutRegex.test(control.value) ? null : { invalidRutFormat: true };
  }

  optionalMinLengthValidator(length: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      return value.length >= length ? null : { minlength: { requiredLength: length, actualLength: value.length } };
    };
  }

  passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password && !confirmPassword) {
      return null;
    }
    return password === confirmPassword ? null : { passwordMismatch: true };
  };

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