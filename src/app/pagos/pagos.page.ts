import { Component, OnInit } from '@angular/core';
import { GymService, Pago } from '../services/gym.service';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  styleUrls: ['./pagos.page.scss']
})
export class PagosPage implements OnInit {

  pagos: Pago[] = [];
  pagosPendientes: Pago[] = [];
  mensaje = '';

  constructor(private gymService: GymService) {}

  ngOnInit() {
    this.gymService.getPagosUsuario().subscribe(data => {
      this.pagos = data.sort((a, b) => {
        if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1;
        if (a.estado !== 'pendiente' && b.estado === 'pendiente') return 1;
        return 0;
      });

      this.pagosPendientes = this.pagos.filter(p => p.estado === 'pendiente');
    });
  }

  abrirFlow(pago: Pago) {
    if (!pago.linkFlow) {
      this.mensaje = 'Este plan no tiene link de pago configurado.';
      return;
    }

    window.open(pago.linkFlow, '_blank');
  }

  async eliminarPago(pago: Pago) {
    if (!pago.id) return;

    const confirmar = confirm(`¿Eliminar el plan pendiente "${pago.planNombre}"?`);
    if (!confirmar) return;

    try {
      await this.gymService.eliminarPagoPendiente(pago.id);
      this.mensaje = 'Plan pendiente eliminado correctamente.';
    } catch (error: any) {
      console.error(error);
      this.mensaje = error.message || 'No fue posible eliminar el plan.';
    }
  }
}