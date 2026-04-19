import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export interface Horario {
  id?: string;
  fecha: string;
  hora: string;
  cupos: number;
  cuposDisponibles: number;
  entrenador?: string;
}

export interface Reserva {
  id?: string;
  userId: string;
  clienteNombre: string;
  horarioId?: string;
  fecha: string;
  hora: string;
  estado: 'confirmada' | 'cancelada' | 'pendiente_pago';
  createdAt: string;
}

export interface Pago {
  id?: string;
  userId: string;
  planId: string;
  planNombre: string;
  monto: number;
  referencia: string;
  estado: 'pendiente' | 'validado' | 'cancelado';
  createdAt: string;
}

export interface PlanGym {
  id: string;
  nombre: string;
  precio: number;
  sesiones: number;
  descripcion: string[];
  recomendado?: boolean;
}

@Injectable({ providedIn: 'root' })
export class GymService {
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  getHorarios(): Observable<Horario[]> {
    return this.firestore.collection<Horario>('horarios').snapshotChanges().pipe(
      map(actions =>
        actions.map(a => ({
          id: a.payload.doc.id,
          ...(a.payload.doc.data() as Horario)
        }))
      )
    );
  }

  getReservasUsuario(): Observable<Reserva[]> {
    return this.auth.authState.pipe(
      switchMap(user => {
        if (!user) return of([]);

        return this.firestore.collection<Reserva>(
          'reservas',
          ref => ref.where('userId', '==', user.uid)
        ).snapshotChanges().pipe(
          map(actions =>
            actions.map(a => ({
              id: a.payload.doc.id,
              ...(a.payload.doc.data() as Reserva)
            }))
          )
        );
      })
    );
  }

  getPagosUsuario(): Observable<Pago[]> {
    return this.auth.authState.pipe(
      switchMap(user => {
        if (!user) return of([]);

        return this.firestore.collection<Pago>(
          'pagos',
          ref => ref.where('userId', '==', user.uid)
        ).snapshotChanges().pipe(
          map(actions =>
            actions.map(a => ({
              id: a.payload.doc.id,
              ...(a.payload.doc.data() as Pago)
            }))
          )
        );
      })
    );
  }

  getHorariosDisponiblesPorFecha(fecha: string): Observable<Horario[]> {
    return this.firestore.collection<Horario>(
      'horarios',
      ref => ref.where('fecha', '==', fecha)
    ).snapshotChanges().pipe(
      map(actions =>
        actions
          .map(a => ({
            id: a.payload.doc.id,
            ...(a.payload.doc.data() as Horario)
          }))
          .filter(h => h.cuposDisponibles > 0)
      )
    );
  }

  getResumenAdmin(): Observable<{ reservas: number; pagosPendientes: number; horarios: number }> {
    return this.firestore.collection('reservas').valueChanges().pipe(
      switchMap((reservas: any[]) =>
        this.firestore.collection('pagos').valueChanges().pipe(
          switchMap((pagos: any[]) =>
            this.firestore.collection('horarios').valueChanges().pipe(
              map((horarios: any[]) => ({
                reservas: reservas.length,
                pagosPendientes: pagos.filter(p => p.estado === 'pendiente').length,
                horarios: horarios.length
              }))
            )
          )
        )
      )
    );
  }

  getPlanesDisponibles(): PlanGym[] {
    return [
      {
        id: 'empieza-a-moverte',
        nombre: 'Empieza a moverte',
        precio: 32000,
        sesiones: 8,
        descripcion: [
          'Evaluación inicial',
          'Rutina personalizada mensual',
          'Acompañamiento profesional en sala'
        ]
      },
      {
        id: 'movimiento-con-confianza',
        nombre: 'Movimiento con confianza',
        precio: 39000,
        sesiones: 12,
        descripcion: [
          'Evaluación inicial',
          'Rutina personalizada mensual',
          'Acompañamiento profesional en sala',
          'Mayor enfoque en generar hábitos saludables'
        ]
      },
      {
        id: 'prolympo',
        nombre: 'Prolympo',
        precio: 48000,
        sesiones: 12,
        recomendado: true,
        descripcion: [
          'Evaluación inicial',
          'Rutina personalizada mensual',
          'Acompañamiento profesional en sala',
          'Registro de progreso',
          'Ajustes en cada sesión',
          'Asesoría nutricional'
        ]
      },
      {
        id: 'plan-estudiante',
        nombre: 'Plan estudiante (<60 años)',
        precio: 30000,
        sesiones: 12,
        descripcion: [
          'Evaluación inicial',
          'Rutina personalizada mensual',
          'Acompañamiento profesional',
          'Hábitos saludables',
          'Registro de progreso',
          'Ajustes en cada sesión'
        ]
      },
      {
        id: 'clase-esporadica',
        nombre: 'Clase esporádica',
        precio: 6000,
        sesiones: 1,
        descripcion: [
          '1 sesión individual'
        ]
      }
    ];
  }

  async crearPagoPlan(plan: PlanGym): Promise<void> {
    const user = await this.auth.currentUser;
    if (!user) throw new Error('Debes iniciar sesión');

    await this.firestore.collection('pagos').add({
      userId: user.uid,
      planId: plan.id,
      planNombre: plan.nombre,
      monto: plan.precio,
      referencia: '',
      estado: 'pendiente',
      createdAt: new Date().toISOString()
    });
  }

  async pagarPlan(pagoId: string, referencia: string): Promise<void> {
    const pagoRef = this.firestore.collection('pagos').doc(pagoId).ref;
    const user = await this.auth.currentUser;
    if (!user) throw new Error('Debes iniciar sesión');

    const planes = this.getPlanesDisponibles();

    await this.firestore.firestore.runTransaction(async transaction => {
      const pagoSnap = await transaction.get(pagoRef);

      if (!pagoSnap.exists) {
        throw new Error('El pago no existe');
      }

      const pagoData = pagoSnap.data() as Pago;

      if (pagoData.estado === 'validado') {
        return;
      }

      const plan = planes.find(p => p.id === pagoData.planId);
      if (!plan) {
        throw new Error('El plan asociado no existe');
      }

      const userRef = this.firestore.collection('users').doc(user.uid).ref;

      const hoy = new Date();
      const fechaInicio = this.formatearFecha(hoy);

      const fechaFinObj = new Date(hoy);
      fechaFinObj.setMonth(fechaFinObj.getMonth() + 1);
      const fechaFin = this.formatearFecha(fechaFinObj);

      transaction.update(pagoRef, {
        estado: 'validado',
        referencia
      });

      transaction.set(userRef, {
        planActivo: plan.nombre,
        planId: plan.id,
        precioPlan: plan.precio,
        sesionesTotales: plan.sesiones,
        sesionesDisponibles: plan.sesiones,
        vigenciaInicio: fechaInicio,
        vigenciaFin: fechaFin
      }, { merge: true });
    });
  }

  async crearReserva(data: {
    clienteNombre: string;
    horarioId: string;
    fecha: string;
    hora: string;
    estado: 'confirmada' | 'cancelada' | 'pendiente_pago';
  }): Promise<string> {
    const user = await this.auth.currentUser;
    if (!user) throw new Error('Debes iniciar sesión');

    const userRef = this.firestore.collection('users').doc(user.uid).ref;
    const horarioRef = this.firestore.collection('horarios').doc(data.horarioId).ref;
    const reservaDoc = this.firestore.collection('reservas').doc();

    await this.firestore.firestore.runTransaction(async transaction => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        throw new Error('No se encontró el perfil del usuario');
      }

      const userData = userSnap.data() as any;

      if (!userData.planActivo) {
        throw new Error('Debes tener un plan activo para reservar');
      }

      if ((userData.sesionesDisponibles ?? 0) <= 0) {
        throw new Error('No tienes sesiones disponibles');
      }

      const fechaReserva = new Date(data.fecha);

      if (userData.vigenciaFin) {
        const vigenciaFin = new Date(userData.vigenciaFin);
        if (fechaReserva > vigenciaFin) {
          throw new Error('No puedes reservar fuera de la vigencia del plan');
        }
      }

      const horarioSnap = await transaction.get(horarioRef);
      if (!horarioSnap.exists) {
        throw new Error('El horario no existe');
      }

      const horarioData = horarioSnap.data() as Horario;

      if (horarioData.cuposDisponibles <= 0) {
        throw new Error('No hay cupos disponibles para este horario');
      }

      transaction.update(horarioRef, {
        cuposDisponibles: horarioData.cuposDisponibles - 1
      });

      transaction.update(userRef, {
        sesionesDisponibles: (userData.sesionesDisponibles ?? 0) - 1
      });

      transaction.set(reservaDoc.ref, {
        ...data,
        userId: user.uid,
        estado: 'confirmada',
        createdAt: new Date().toISOString()
      });
    });

    return reservaDoc.ref.id;
  }

  async generarHorariosProximos30Dias(): Promise<void> {
    const horariosSemana = {
      1: ['08:00', '09:00', '18:00', '19:00'],
      2: ['08:00', '09:00', '18:00', '19:00'],
      3: ['08:00', '09:00', '18:00', '19:00'],
      4: ['08:00', '09:00', '18:00', '19:00'],
      5: ['08:00', '09:00', '18:00', '19:00'],
      6: ['09:00', '10:00']
    };

    const cuposPorDefecto = 3;
    const entrenadorPorDefecto = 'Coach Gym Olimpo';

    for (let i = 0; i < 30; i++) {
      const fechaObj = new Date();
      fechaObj.setDate(fechaObj.getDate() + i);

      const diaSemana = fechaObj.getDay();
      const fecha = this.formatearFecha(fechaObj);

      const horas = horariosSemana[diaSemana as keyof typeof horariosSemana];
      if (!horas || !horas.length) continue;

      for (const hora of horas) {
        const existe = await this.existeHorario(fecha, hora);
        if (existe) continue;

        await this.firestore.collection('horarios').add({
          fecha,
          hora,
          cupos: cuposPorDefecto,
          cuposDisponibles: cuposPorDefecto,
          entrenador: entrenadorPorDefecto
        });
      }
    }
  }

  private async existeHorario(fecha: string, hora: string): Promise<boolean> {
    const snap = await this.firestore.collection(
      'horarios',
      ref => ref
        .where('fecha', '==', fecha)
        .where('hora', '==', hora)
        .limit(1)
    ).get().toPromise();

    return !!snap && !snap.empty;
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async cancelarReserva(id: string): Promise<void> {
    const reservaRef = this.firestore.collection('reservas').doc(id).ref;

    await this.firestore.firestore.runTransaction(async transaction => {
      const reservaSnap = await transaction.get(reservaRef);

      if (!reservaSnap.exists) {
        throw new Error('La reserva no existe');
      }

      const reservaData = reservaSnap.data() as any;

      if (reservaData.estado === 'cancelada') {
        return;
      }

      const horarioRef = this.firestore.collection('horarios').doc(reservaData.horarioId).ref;
      const horarioSnap = await transaction.get(horarioRef);

      if (!horarioSnap.exists) {
        throw new Error('El horario no existe');
      }

      const horarioData = horarioSnap.data() as any;

      const userRef = this.firestore.collection('users').doc(reservaData.userId).ref;
      const userSnap = await transaction.get(userRef);
      const userData = userSnap.data() as any;

      transaction.update(horarioRef, {
        cuposDisponibles: horarioData.cuposDisponibles + 1
      });

      transaction.update(userRef, {
        sesionesDisponibles: (userData.sesionesDisponibles ?? 0) + 1
      });

      transaction.update(reservaRef, {
        estado: 'cancelada'
      });
    });
  }
}