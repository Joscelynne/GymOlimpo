import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GymService, Pago } from '../services/gym.service';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  styleUrls: ['./pagos.page.scss']
})
export class PagosPage implements OnInit {
  form: FormGroup;
  pagos: Pago[] = [];
  pagosPendientes: Pago[] = [];
  pagoSeleccionado: Pago | null = null;
  mensaje = '';

  constructor(
    private fb: FormBuilder,
    private gymService: GymService
  ) {
    this.form = this.fb.group({
      monto: [{ value: 0, disabled: true }, Validators.required],
      referencia: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.gymService.getPagosUsuario().subscribe(data => {
      this.pagos = data.sort((a, b) => {
        if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1;
        if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1;
        return 0;
      });

      this.pagosPendientes = this.pagos.filter(p => p.estado === 'pendiente');

      if (
        this.pagoSeleccionado &&
        !this.pagosPendientes.some(p => p.id === this.pagoSeleccionado?.id)
      ) {
        this.pagoSeleccionado = null;
        this.form.reset({
          monto: 0,
          referencia: ''
        });
      }
    });
  }

  seleccionarPago(pago: Pago) {
    if (pago.estado !== 'pendiente') return;

    this.pagoSeleccionado = pago;
    this.mensaje = '';

    this.form.patchValue({
      monto: pago.monto,
      referencia: ''
    });
  }

  abrirFlow(pago: Pago) {
    if (!pago.linkFlow) {
      this.mensaje = 'Este plan no tiene link de pago configurado.';
      return;
    }

    window.open(pago.linkFlow, '_blank');
  }

  async guardar() {
    if (this.form.invalid || !this.pagoSeleccionado?.id) {
      this.mensaje = 'Debes seleccionar un pago pendiente e ingresar la referencia.';
      return;
    }

    try {
      await this.gymService.pagarPlan(
        this.pagoSeleccionado.id,
        this.form.getRawValue().referencia
      );

      this.mensaje = 'Pago registrado correctamente.';
      this.pagoSeleccionado = null;

      this.form.reset({
        monto: 0,
        referencia: ''
      });
    } catch (error: any) {
      console.error(error);
      this.mensaje = error.message || 'No fue posible registrar el pago.';
    }
  }
}