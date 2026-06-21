import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map, switchMap } from 'rxjs/operators';
import { Observable, of, forkJoin } from 'rxjs';

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
  referencia: string
  linkFlow?: string;
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
  linkFlow?: string;
  tipo?: 'clase' | 'asesoria';
  duracionMeses?: number;
  detalles?: string[];
}

@Injectable({ providedIn: 'root' })
export class GymService {
  constructor(
    private firestore: AngularFirestore,
    private auth: AngularFireAuth
  ) { }

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

  async crearHorario(
  fecha: string,
  hora: string,
  cupos: number
): Promise<void> {

  const existe = await this.existeHorario(fecha, hora);

  if (existe) {
    throw new Error('Ya existe un horario para esa fecha y hora');
  }

  await this.firestore.collection('horarios').add({
    fecha,
    hora,
    cupos,
    cuposDisponibles: cupos,
    entrenador: 'Manu'
  });
}

async editarHorario(
  id: string,
  datos: Partial<Horario>
): Promise<void> {

  await this.firestore
    .collection('horarios')
    .doc(id)
    .update(datos);
}

async eliminarHorario(id: string): Promise<void> {

  const reservas = await this.firestore.collection(
    'reservas',
    ref => ref.where('horarioId', '==', id)
  ).get().toPromise();

  if (reservas && !reservas.empty) {
    throw new Error(
      'No puedes eliminar un horario con reservas asociadas'
    );
  }

  await this.firestore
    .collection('horarios')
    .doc(id)
    .delete();
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
      map(actions => {
        const list = actions
          .map(a => ({
            id: a.payload.doc.id,
            ...(a.payload.doc.data() as Horario)
          }))
          .filter(h => h.cuposDisponibles > 0)
          .sort((a, b) => a.hora.localeCompare(b.hora));

        const seen = new Set<string>();
        return list.filter(h => {
          if (seen.has(h.hora)) {
            return false;
          }
          seen.add(h.hora);
          return true;
        });
      })
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
      tipo: 'clase',
      linkFlow: 'https://sandbox.flow.cl/uri/5HrfKhwv4',
      descripcion: [
        'Evaluación inicial',
        'Rutina personalizada mensual',
        'Acompañamiento profesional en sala'
      ]
    },
    {
      id: 'movimiento-con-confianza',
      nombre: 'Movimiento con Confianza',
      precio: 39000,
      sesiones: 12,
      tipo: 'clase',
      linkFlow: 'https://sandbox.flow.cl/uri/0L7krHT8b',
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
      tipo: 'clase',
      recomendado: true,
      linkFlow: 'https://sandbox.flow.cl/uri/dcT46SPK7',
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
      tipo: 'clase',
      linkFlow: 'https://sandbox.flow.cl/uri/zQ2MrKKCb',
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
      tipo: 'clase',
      linkFlow: 'https://sandbox.flow.cl/uri/bmZFK0ty4',
      descripcion: [
        '1 sesión individual'
      ]
    },
    {
      id: 'asesoria-1-mes',
      nombre: 'Asesoría Personalizada - 1 Mes',
      precio: 30000,
      sesiones: 1,
      duracionMeses: 1,
      tipo: 'asesoria',
      linkFlow: 'https://sandbox.flow.cl/uri/asesoria-1mes',
      descripcion: [
        'Evaluación inicial completa',
        'Rutina personalizada en PDF',
        'Técnica y ejecución de ejercicios',
        'Seguimiento por WhatsApp'
      ],
      detalles: [
        'Entrevista inicial para conocer tus objetivos',
        'Evaluación de experiencia y lesiones',
        'Análisis de disponibilidad de tiempo y equipamiento',
        'Diseño de plan completamente personalizado',
        'Rutina en formato PDF fácil de seguir',
        'Explicación de ejecución correcta de ejercicios',
        'Intensidad y progresiones adaptadas a tu nivel',
        'Acompañamiento por WhatsApp',
        'Resolución de dudas en tiempo real',
        'Corrección de técnica con videos',
        'Ajustes de intensidad según necesidad',
        'Modificación de ejercicios si es requerido'
      ]
    },
    {
      id: 'asesoria-2-meses',
      nombre: 'Asesoría Personalizada - 2 Meses',
      precio: 50000,
      sesiones: 2,
      duracionMeses: 2,
      tipo: 'asesoria',
      linkFlow: 'https://sandbox.flow.cl/uri/asesoria-2meses',
      descripcion: [
        'Evaluación inicial completa',
        'Rutina personalizada en PDF',
        'Técnica y ejecución de ejercicios',
        'Seguimiento por WhatsApp prolongado'
      ],
      detalles: [
        'Entrevista inicial para conocer tus objetivos',
        'Evaluación de experiencia y lesiones',
        'Análisis de disponibilidad de tiempo y equipamiento',
        'Diseño de plan completamente personalizado',
        'Rutina en formato PDF fácil de seguir',
        'Explicación de ejecución correcta de ejercicios',
        'Intensidad y progresiones adaptadas a tu nivel',
        'Acompañamiento por WhatsApp durante 2 meses',
        'Resolución de dudas en tiempo real',
        'Corrección de técnica con videos',
        'Ajustes de intensidad según progreso',
        'Modificación de ejercicios si es requerido',
        'Seguimiento de avances y adaptación'
      ]
    },
    {
      id: 'asesoria-3-meses',
      nombre: 'Asesoría Personalizada - 3 Meses',
      precio: 60000,
      sesiones: 3,
      duracionMeses: 3,
      tipo: 'asesoria',
      recomendado: true,
      linkFlow: 'https://sandbox.flow.cl/uri/asesoria-3meses',
      descripcion: [
        'Evaluación inicial completa',
        'Rutina personalizada en PDF',
        'Técnica y ejecución de ejercicios',
        'Seguimiento intensivo por WhatsApp',
        'Revisión de progreso mensual'
      ],
      detalles: [
        'Entrevista inicial para conocer tus objetivos',
        'Evaluación de experiencia y lesiones',
        'Análisis de disponibilidad de tiempo y equipamiento',
        'Diseño de plan completamente personalizado',
        'Rutina en formato PDF fácil de seguir',
        'Explicación de ejecución correcta de ejercicios',
        'Intensidad y progresiones adaptadas a tu nivel',
        'Acompañamiento por WhatsApp durante 3 meses',
        'Resolución de dudas en tiempo real',
        'Corrección de técnica con videos',
        'Revisiones mensuales de progreso',
        'Ajustes de intensidad según progreso',
        'Modificación de ejercicios según resultados',
        'Adaptación continua del plan'
      ]
    },
    {
      id: 'asesoria-6-meses',
      nombre: 'Asesoría Personalizada - 6 Meses',
      precio: 110000,
      sesiones: 6,
      duracionMeses: 6,
      tipo: 'asesoria',
      linkFlow: 'https://sandbox.flow.cl/uri/asesoria-6meses',
      descripcion: [
        'Evaluación inicial completa',
        'Rutina personalizada en PDF',
        'Técnica y ejecución de ejercicios',
        'Seguimiento integral por WhatsApp',
        'Revisiones bimensuales'
      ],
      detalles: [
        'Entrevista inicial para conocer tus objetivos',
        'Evaluación de experiencia y lesiones',
        'Análisis de disponibilidad de tiempo y equipamiento',
        'Diseño de plan completamente personalizado',
        'Rutina en formato PDF fácil de seguir',
        'Explicación de ejecución correcta de ejercicios',
        'Intensidad y progresiones adaptadas a tu nivel',
        'Acompañamiento por WhatsApp durante 6 meses',
        'Resolución de dudas en tiempo real',
        'Corrección de técnica con videos',
        'Revisiones bimensuales de progreso',
        'Ajustes de intensidad según progreso',
        'Modificación de ejercicios según resultados',
        'Adaptación continua del plan',
        'Construir hábitos sostenibles'
      ]
    }
        ];
  }

  getPlanesCustom(): Observable<PlanGym[]> {
    return this.firestore.collection<PlanGym>('planes').valueChanges({ idField: 'id' });
  }

  async crearPlanCustom(plan: Omit<PlanGym, 'id'>): Promise<void> {
    const docRef = this.firestore.collection('planes').doc();
    const id = docRef.ref.id;
    await docRef.set({ ...plan, id });
  }

  async eliminarPlanCustom(planId: string): Promise<void> {
    await this.firestore.collection('planes').doc(planId).delete();
  }

  async eliminarPagoPendiente(pagoId: string): Promise<void> {
  const user = await this.auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión');

  const pagoRef = this.firestore.collection('pagos').doc(pagoId).ref;
  const pagoSnap = await pagoRef.get();

  if (!pagoSnap.exists) {
    throw new Error('El pago no existe');
  }

  const pagoData = pagoSnap.data() as Pago;

  if (pagoData.userId !== user.uid) {
    throw new Error('No puedes eliminar este pago');
  }

  if (pagoData.estado !== 'pendiente') {
    throw new Error('Solo puedes eliminar pagos pendientes');
  }

  await pagoRef.delete();
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
      linkFlow: plan.linkFlow || '',
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

      let plan = planes.find(p => p.id === pagoData.planId);
      if (!plan) {
        const planDoc = await transaction.get(this.firestore.collection('planes').doc(pagoData.planId).ref);
        if (planDoc.exists) {
          plan = planDoc.data() as PlanGym;
          plan.id = planDoc.id;
        }
      }

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
    const entrenadorPorDefecto = 'Coach Gym Olympo';

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
      
      transaction.update(reservaRef, {
        estado: 'cancelada'
      });
    });
  }

  getReservasPorFecha(fecha: string) {
    return this.firestore.collection('reservas', ref =>
      ref.where('fecha', '==', fecha)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => ({ id: a.payload.doc.id, ...(a.payload.doc.data() as Reserva) }))
        .sort((a, b) => a.hora.localeCompare(b.hora))
      )
    );
  }

  getPagosPendientes() {
    return this.firestore.collection<Pago>('pagos', ref => ref.where('estado', '==', 'pendiente')).snapshotChanges().pipe(
      map(actions => actions.map(a => ({ id: a.payload.doc.id, ...(a.payload.doc.data() as Pago) })))
    );
  }

  getPagosValidados() {
    return this.firestore.collection<Pago>('pagos', ref => ref.where('estado', '==', 'validado')).snapshotChanges().pipe(
      map(actions => actions.map(a => ({ id: a.payload.doc.id, ...(a.payload.doc.data() as Pago) })))
    );
  }

  getReservasRecientes(limit = 25) {
    return this.firestore.collection<Reserva>('reservas', ref => ref.orderBy('createdAt', 'desc').limit(limit)).snapshotChanges().pipe(
      map(actions => actions.map(a => ({ id: a.payload.doc.id, ...(a.payload.doc.data() as Reserva) })))
    );
  }

  async confirmarAsistencia(reservaId: string): Promise<void> {
    const reservaRef = this.firestore.collection('reservas').doc(reservaId).ref;

    await this.firestore.firestore.runTransaction(async transaction => {
      const reservaSnap = await transaction.get(reservaRef);
      if (!reservaSnap.exists) throw new Error('Reserva no encontrada');

      const reservaData = reservaSnap.data() as any;
      if (reservaData.estado === 'confirmada' && reservaData.checkIn) return;

      transaction.update(reservaRef, {
        estado: 'confirmada',
        checkIn: new Date().toISOString()
      });
    });
  }

  // ── New dashboard methods ──────────────────────────────────────────────

  /** Clientes activos (planActivo not empty) */
  getClientesActivos(): Observable<any[]> {
    return this.firestore.collection('users', ref =>
      ref.where('planActivo', '!=', '')
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => ({
        uid: a.payload.doc.id,
        ...(a.payload.doc.data() as any)
      })))
    );
  }

  /** Last N pagos (all statuses), ordered by createdAt desc — enriched with user name */
  getPagosRecientes(limit = 10): Observable<(Pago & { clienteNombre: string })[]> {
    return this.firestore.collection<Pago>('pagos',
      ref => ref.orderBy('createdAt', 'desc').limit(limit)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => ({
        id: a.payload.doc.id,
        ...(a.payload.doc.data() as Pago)
      }))),
      switchMap(pagos => {
        if (!pagos.length) return of([]);
        const userFetches = pagos.map(p =>
          this.firestore.collection('users').doc(p.userId).get().pipe(
            map(snap => {
              const data = snap.data() as any;
              const nombre = data?.nombre && data?.apellido
                ? `${data.nombre} ${data.apellido}`.trim()
                : data?.nombre || data?.displayName || data?.email || 'Sin nombre';
              return { ...p, clienteNombre: nombre };
            })
          )
        );
        return forkJoin(userFetches);
      })
    );
  }

  /** Alias for getClientesActivos — used for inactivity cross-filtering */
  getClientesConPlanActivo(): Observable<any[]> {
    return this.getClientesActivos();
  }

  /** Users with vigenciaFin set (for expiring plans panel, limit 200) */
  getUsuariosConVigencia(): Observable<any[]> {
    return this.firestore.collection('users', ref =>
      ref.where('vigenciaFin', '!=', '').limit(200)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => ({
        uid: a.payload.doc.id,
        ...(a.payload.doc.data() as any)
      })))
    );
  }

  /** Horarios for a specific date, ordered by hora asc */
  getHorariosPorFecha(fecha: string): Observable<Horario[]> {
    return this.firestore.collection<Horario>('horarios',
      ref => ref.where('fecha', '==', fecha)
    ).snapshotChanges().pipe(
      map(actions => {
        const list = actions.map(a => ({
          id: a.payload.doc.id,
          ...(a.payload.doc.data() as Horario)
        })).sort((a, b) => a.hora.localeCompare(b.hora));

        const seen = new Set<string>();
        return list.filter(h => {
          if (seen.has(h.hora)) {
            return false;
          }
          seen.add(h.hora);
          return true;
        });
      })
    );
  }

  /** Reservas within a date range (for 7-day line chart) */
  getReservasPorRango(fechaInicio: string, fechaFin: string): Observable<Reserva[]> {
    return this.firestore.collection<Reserva>('reservas', ref =>
      ref.where('fecha', '>=', fechaInicio)
         .where('fecha', '<=', fechaFin)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => ({
        id: a.payload.doc.id,
        ...(a.payload.doc.data() as Reserva)
      })))
    );
  }
}