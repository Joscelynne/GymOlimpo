import { Component, OnInit } from '@angular/core';
import { GymService, Horario } from '../services/gym.service';

@Component({
  selector: 'app-horarios',
  templateUrl: './horarios.page.html',
  styleUrls: ['./horarios.page.scss']
})
export class HorariosPage implements OnInit {
  horarios: Horario[] = [];
  cargando = true;

  constructor(private gymService: GymService) {}

  ngOnInit() {
    this.gymService.getHorarios().subscribe(data => {
      this.horarios = data.sort((a, b) => {
        const fechaHoraA = `${a.fecha} ${a.hora}`;
        const fechaHoraB = `${b.fecha} ${b.hora}`;
        return fechaHoraA.localeCompare(fechaHoraB);
      });
      this.cargando = false;
    });
  }
}