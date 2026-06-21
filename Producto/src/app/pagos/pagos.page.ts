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

  // Estados del Pago
  mostrarModalPago = false;
  cargandoPago = false;
  pagoSeleccionado: Pago | null = null;
  pasoPago: 'tarjeta' | 'procesando' | 'exito' = 'tarjeta';

  // Variables de Tarjeta Interactiva
  tarjetaNumero = '';
  tarjetaNombre = '';
  tarjetaVence = '';
  tarjetaCvv = '';

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

  abrirPago(pago: Pago) {
    this.pagoSeleccionado = pago;
    this.pasoPago = 'tarjeta';
    this.tarjetaNumero = '';
    this.tarjetaNombre = '';
    this.tarjetaVence = '';
    this.tarjetaCvv = '';
    this.mostrarModalPago = true;
    this.cargandoPago = false;
    this.mensaje = '';
  }

  cerrarPago() {
    this.mostrarModalPago = false;
    this.pagoSeleccionado = null;
  }

  // Formateadores automáticos en tiempo de digitación
  formatearTarjetaNumero(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Solo números
    if (value.length > 16) {
      value = value.substring(0, 16);
    }
    // Agrupa de a 4 números
    let parts = value.match(/.{1,4}/g);
    this.tarjetaNumero = parts ? parts.join(' ') : value;
  }

  formatearFechaVence(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Solo números
    if (value.length > 4) {
      value = value.substring(0, 4);
    }
    if (value.length > 2) {
      this.tarjetaVence = value.substring(0, 2) + '/' + value.substring(2);
    } else {
      this.tarjetaVence = value;
    }
  }

  formatearCvv(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Solo números
    if (value.length > 3) {
      value = value.substring(0, 3);
    }
    this.tarjetaCvv = value;
  }

  async ejecutarPago() {
    if (!this.pagoSeleccionado || !this.pagoSeleccionado.id) return;

    // Validar Número de Tarjeta (debe tener 16 dígitos, sin contar espacios)
    const digitosTarjeta = this.tarjetaNumero.replace(/\s+/g, '');
    if (digitosTarjeta.length !== 16) {
      alert('El número de tarjeta debe tener exactamente 16 dígitos.');
      return;
    }

    // Validar Nombre
    if (!this.tarjetaNombre.trim()) {
      alert('Por favor, ingresa el nombre del titular.');
      return;
    }

    // Validar Fecha de Vencimiento
    if (this.tarjetaVence.length !== 5) {
      alert('La fecha de vencimiento debe tener el formato MM/AA (ej: 08/29).');
      return;
    }
    
    const [mesStr, anioStr] = this.tarjetaVence.split('/');
    const mes = parseInt(mesStr, 10);
    if (isNaN(mes) || mes < 1 || mes > 12) {
      alert('El mes de vencimiento debe ser entre 01 y 12.');
      return;
    }

    // Validar CVV
    if (this.tarjetaCvv.length !== 3) {
      alert('El CVV debe tener exactamente 3 dígitos.');
      return;
    }

    this.cargandoPago = true;
    this.pasoPago = 'procesando';

    // Simular retraso de red de 2 segundos para realismo
    setTimeout(async () => {
      try {
        const refMock = 'MOCK-WP-' + Math.floor(100000 + Math.random() * 900000);
        
        // Llamar a la transacción de activación de membresía
        await this.gymService.pagarPlan(this.pagoSeleccionado!.id!, refMock);
        
        this.pasoPago = 'exito';
        this.mensaje = `Pago procesado con éxito. Referencia: ${refMock}`;

        // Esperar 1.5s en la pantalla de éxito antes de cerrar
        setTimeout(() => {
          this.mostrarModalPago = false;
          this.pagoSeleccionado = null;
          this.cargandoPago = false;
        }, 1500);

      } catch (error: any) {
        console.error(error);
        alert(error.message || 'Error al procesar el pago.');
        this.pasoPago = 'tarjeta';
        this.cargandoPago = false;
      }
    }, 2000);
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