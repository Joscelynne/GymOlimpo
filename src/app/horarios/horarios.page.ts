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

  // Cambia a true para probar funciones admin
  esAdmin = true;

  constructor(
    private gymService: GymService
  ) {}

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

  async crearHorario() {

    const fecha = prompt('Ingrese fecha (YYYY-MM-DD)');
    if (!fecha) return;

    const hora = prompt('Ingrese hora (HH:mm)');
    if (!hora) return;

    const cupos = Number(prompt('Cantidad de cupos'));

    if (!cupos || cupos <= 0) {
      alert('Cantidad inválida');
      return;
    }

    try {

      await this.gymService.crearHorario(
        fecha,
        hora,
        cupos
      );

      alert('Horario creado correctamente');

    } catch (error: any) {

      console.error(error);
      alert(error.message);

    }

  }

  async editarHorario(horario: Horario) {

    const nuevoCupo = Number(
      prompt(
        'Nuevo número de cupos',
        horario.cupos.toString()
      )
    );

    if (!nuevoCupo || nuevoCupo <= 0) {
      return;
    }

    try {

      await this.gymService.editarHorario(
        horario.id!,
        {
          cupos: nuevoCupo,
          cuposDisponibles: nuevoCupo
        }
      );

      alert('Horario actualizado');

    } catch (error: any) {

      console.error(error);
      alert(error.message);

    }

  }

  async eliminarHorario(horario: Horario) {

    const confirmar = confirm(
      `¿Eliminar horario ${horario.fecha} ${horario.hora}?`
    );

    if (!confirmar) return;

    try {

      await this.gymService.eliminarHorario(
        horario.id!
      );

      alert('Horario eliminado');

    } catch (error: any) {

      console.error(error);
      alert(error.message);

    }

  }

}