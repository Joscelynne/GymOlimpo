import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { MenuController } from '@ionic/angular';
import { UserService } from 'src/app/services/user.service';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-completar-perfil',
  templateUrl: './completar-perfil.page.html',
  styleUrls: ['./completar-perfil.page.scss'],
})
export class CompletarPerfilPage implements OnInit {

  form: FormGroup;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private afAuth: AngularFireAuth,
    private userService: UserService,
    private menuCtrl: MenuController
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      rut: ['', [Validators.required, this.validarRut]],
      telefono: ['', [Validators.required, this.validarTelefono]]
    });
  }

  ngOnInit() {
    this.userService.user$.pipe(
      filter(user => !!user),
      take(1)
    ).subscribe(user => {
      this.form.patchValue({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        rut: user.rut || '',
        telefono: user.telefono || ''
      });
    });
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(false);
  }

  ionViewWillLeave() {
    this.menuCtrl.enable(true);
  }

  formatearRut(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/[^0-9kK]/g, '');

    if (valor.length > 1) {
      const dv = valor.slice(-1);
      let cuerpo = valor.slice(0, -1);
      cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      valor = `${cuerpo}-${dv}`;
    }

    this.form.get('rut')?.setValue(valor, { emitEvent: false });
  }

  formatearTelefono(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/[^0-9]/g, '');

    if (valor.length <= 2) {
      valor = valor;
    } else if (valor.length <= 3) {
      valor = `+${valor.slice(0, 2)} ${valor.slice(2)}`;
    } else if (valor.length <= 4) {
      valor = `+${valor.slice(0, 2)} ${valor.slice(2, 3)} ${valor.slice(3)}`;
    } else if (valor.length <= 8) {
      valor = `+${valor.slice(0, 2)} ${valor.slice(2, 3)} ${valor.slice(3, 7)} ${valor.slice(7)}`;
    } else {
      valor = `+${valor.slice(0, 2)} ${valor.slice(2, 3)} ${valor.slice(3, 7)} ${valor.slice(7, 11)}`;
    }

    this.form.get('telefono')?.setValue(valor, { emitEvent: false });
  }

  validarRut(control: AbstractControl): ValidationErrors | null {
    const rutRegex = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]$/;
    return rutRegex.test(control.value) ? null : { invalidRut: true };
  }

  validarTelefono(control: AbstractControl): ValidationErrors | null {
    const telefonoRegex = /^(\+?56\s?)?9\s?\d{4}\s?\d{4}$/;
    return telefonoRegex.test(control.value) ? null : { invalidTelefono: true };
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;

    try {
      const user = await this.afAuth.currentUser;
      if (!user) throw new Error('No hay usuario autenticado');

      const { rut, telefono, nombre, apellido } = this.form.value;
      await this.userService.updateProfile(user.uid, { rut, telefono, nombre, apellido });

      await this.router.navigate(['/main']);
    } catch (error) {
      console.error('Error guardando perfil:', error);
    } finally {
      this.guardando = false;
    }
  }
}