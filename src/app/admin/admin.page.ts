import { Component, OnInit } from '@angular/core';
import { GymService } from '../services/gym.service';

@Component({ selector: 'app-admin', templateUrl: './admin.page.html', styleUrls: ['./admin.page.scss'] })
export class AdminPage implements OnInit {
  resumen = { reservas: 0, pagosPendientes: 0, horarios: 0 };
  constructor(private gymService: GymService) {}
  ngOnInit() { this.gymService.getResumenAdmin().subscribe(data => this.resumen = data); }

  async generarHorarios() {
    try {
      await this.gymService.generarHorariosProximos30Dias();
      alert('Horarios generados correctamente');
    } catch (error) {
      console.error(error);
      alert('Error al generar horarios');
    }
  }
}
