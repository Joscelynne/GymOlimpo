// src/app/admin/admin.utils.ts
// Pure transformation functions for the GymOlimpo Admin Dashboard
// These functions are stateless and fully testable with fast-check.

import { Horario, Reserva, Pago } from '../services/gym.service';
import {
  KpiCardConfig,
  AlertaAdmin,
  ChartLineData,
  EstadoBloque,
  HorarioDemanda,
  ClientePlanVence,
  ClienteInactivo
} from './admin.models';

// ── Date helpers ────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD using local time. */
export function fechaHoy(): string {
  const d = new Date();
  return _dateToStr(d);
}

/** Returns a date offset by N days from today as YYYY-MM-DD (negative = past). */
export function fechaOffset(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return _dateToStr(d);
}

function _dateToStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── Math helpers ────────────────────────────────────────────────────────

/**
 * Calculates occupancy percentage.
 * floor((cupos - cuposDisponibles) / cupos * 100)
 * Returns 0 if cupos === 0.
 */
export function calcularOcupacion(cupos: number, cuposDisponibles: number): number {
  if (!cupos || cupos <= 0) return 0;
  return Math.floor(((cupos - cuposDisponibles) / cupos) * 100);
}

/**
 * Classifies a time slot block by occupancy percentage.
 * 0 → 'libre', 1–75 → 'parcial', 76–99 → 'casi-lleno', 100 → 'lleno'
 */
export function clasificarBloque(porcentaje: number): EstadoBloque {
  if (porcentaje === 0) return 'libre';
  if (porcentaje <= 75) return 'parcial';
  if (porcentaje < 100) return 'casi-lleno';
  return 'lleno';
}

/**
 * Returns the badge text for days remaining on a plan.
 * 0 → 'Vence hoy', 1 → 'Vence mañana', 2–7 → 'X días'
 */
export function badgePlanVence(diasRestantes: number): string {
  if (diasRestantes === 0) return 'Vence hoy';
  if (diasRestantes === 1) return 'Vence mañana';
  return `${diasRestantes} días`;
}

/**
 * Returns the demand level badge for a time slot.
 * >85 → 'alta', 50–85 → 'media', <50 → 'baja'
 */
export function badgeDemanda(porcentaje: number): 'alta' | 'media' | 'baja' {
  if (porcentaje > 85) return 'alta';
  if (porcentaje >= 50) return 'media';
  return 'baja';
}

/**
 * Formats a number as currency with dot thousands separator.
 * 1234567 → '$1.234.567'
 */
export function formatMonto(monto: number): string {
  const str = Math.floor(monto).toString();
  const formatted = str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${formatted}`;
}

// ── KPI calculation ─────────────────────────────────────────────────────

export function calcularKpis(
  clientes: any[],
  reservasHoy: Reserva[],
  pagos: Pago[],
  usuarios: any[],
  horarios: Horario[],
  hoy: string
): KpiCardConfig[] {
  const clientesActivos = clientes.length;
  const reservasDelDia = reservasHoy.filter(r => r.estado !== 'cancelada').length;
  const pagosPendientes = pagos.length;

  // Planes próximos a vencer (≤7 days)
  const planesPorVencer = calcularPlanesPorVencer(usuarios, hoy).length;

  // Occupancy for today
  const horariosHoy = horarios.filter(h => h.fecha === hoy);
  let totalCupos = 0;
  let cuposOcupados = 0;
  for (const h of horariosHoy) {
    totalCupos += h.cupos;
    cuposOcupados += h.cupos - (h.cuposDisponibles ?? 0);
  }
  const ocupacionPct = totalCupos > 0 ? Math.round((cuposOcupados / totalCupos) * 100) : 0;

  // Monthly revenue from validated payments (rough estimate from available data)
  const ingresosMes = pagos
    .filter(p => (p as any).estado === 'validado')
    .reduce((acc, p) => acc + (p.monto || 0), 0);

  return [
    {
      id: 'clientes-activos',
      label: 'Clientes Activos',
      value: clientesActivos,
      icon: 'people-outline',
      colorClass: 'success',
      loading: false,
      formato: 'numero'
    },
    {
      id: 'reservas-hoy',
      label: 'Reservas de Hoy',
      value: reservasDelDia,
      icon: 'calendar-outline',
      colorClass: 'success',
      loading: false,
      formato: 'numero'
    },
    {
      id: 'ingresos-mes',
      label: 'Ingresos del Mes',
      value: ingresosMes,
      icon: 'cash-outline',
      colorClass: 'neutral',
      loading: false,
      formato: 'moneda'
    },
    {
      id: 'pagos-pendientes',
      label: 'Pagos Pendientes',
      value: pagosPendientes,
      icon: 'card-outline',
      colorClass: pagosPendientes > 0 ? 'warning' : 'success',
      loading: false,
      formato: 'numero'
    },
    {
      id: 'planes-por-vencer',
      label: 'Planes por Vencer',
      value: planesPorVencer,
      icon: 'alert-circle-outline',
      colorClass: planesPorVencer > 0 ? 'warning' : 'success',
      loading: false,
      formato: 'numero'
    },
    {
      id: 'ocupacion-semanal',
      label: 'Ocupación Hoy',
      value: ocupacionPct,
      icon: 'stats-chart-outline',
      colorClass: ocupacionPct > 90 ? 'danger' : 'neutral',
      loading: false,
      formato: 'porcentaje'
    }
  ];
}

// ── Alert generation ────────────────────────────────────────────────────

export function calcularAlertas(
  pagos: Pago[],
  usuarios: any[],
  horariosHoy: Horario[],
  reservas: Reserva[],
  hoy: string
): AlertaAdmin[] {
  const alertas: AlertaAdmin[] = [];

  // 1. Pagos pendientes (urgente)
  const pagosPendientes = pagos.length;
  if (pagosPendientes > 0) {
    alertas.push({
      id: 'pagos-pendientes',
      categoria: 'urgente',
      descripcion: `${pagosPendientes} pago${pagosPendientes > 1 ? 's' : ''} pendiente${pagosPendientes > 1 ? 's' : ''} por validar`,
      conteo: pagosPendientes,
      rutaAccion: '/pagos',
      icono: 'card-outline'
    });
  }

  // 2. Planes próximos a vencer (advertencia)
  const planesPorVencer = calcularPlanesPorVencer(usuarios, hoy).length;
  if (planesPorVencer > 0) {
    alertas.push({
      id: 'planes-por-vencer',
      categoria: 'advertencia',
      descripcion: `${planesPorVencer} cliente${planesPorVencer > 1 ? 's' : ''} con plan próximo a vencer (≤7 días)`,
      conteo: planesPorVencer,
      rutaAccion: '/admin/clientes',
      icono: 'time-outline'
    });
  }

  // 3. Clientes con >3 cancelaciones en últimos 30 días (advertencia)
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  const cancelacionesPorCliente = new Map<string, { nombre: string; count: number }>();
  for (const r of reservas) {
    if (r.estado === 'cancelada') {
      const fechaR = new Date(r.createdAt);
      if (fechaR >= hace30Dias) {
        const prev = cancelacionesPorCliente.get(r.userId) || { nombre: r.clienteNombre, count: 0 };
        cancelacionesPorCliente.set(r.userId, { nombre: r.clienteNombre, count: prev.count + 1 });
      }
    }
  }
  for (const [, data] of cancelacionesPorCliente) {
    if (data.count > 3) {
      alertas.push({
        id: `cancelaciones-${data.nombre}`,
        categoria: 'advertencia',
        descripcion: `${data.nombre} tiene ${data.count} cancelaciones en los últimos 30 días`,
        conteo: data.count,
        rutaAccion: '/admin/clientes',
        icono: 'close-circle-outline'
      });
    }
  }

  // 4. Horarios completamente reservados hoy (informativa)
  const horariosLlenos = horariosHoy.filter(h => (h.cuposDisponibles ?? 0) === 0);
  if (horariosLlenos.length > 0) {
    alertas.push({
      id: 'horarios-llenos',
      categoria: 'informativa',
      descripcion: `${horariosLlenos.length} horario${horariosLlenos.length > 1 ? 's' : ''} completamente reservado${horariosLlenos.length > 1 ? 's' : ''} hoy`,
      conteo: horariosLlenos.length,
      rutaAccion: '/horarios',
      icono: 'checkmark-circle-outline'
    });
  }

  // Sort: urgente → advertencia → informativa
  const order: Record<string, number> = { urgente: 0, advertencia: 1, informativa: 2 };
  return alertas.sort((a, b) => order[a.categoria] - order[b.categoria]);
}

// ── Chart data ──────────────────────────────────────────────────────────

/**
 * Groups reservations by day for a 7-day range.
 * Returns exactly 7 elements; days without reservations have conteo = 0.
 */
export function agruparReservasPorDia(
  reservas: Reserva[],
  inicio: string,
  fin: string
): ChartLineData[] {
  const result: ChartLineData[] = [];
  const startDate = new Date(inicio + 'T00:00:00');
  const endDate = new Date(fin + 'T00:00:00');
  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const fechaStr = _dateToStr(d);
    const conteo = reservas.filter(r => r.fecha === fechaStr).length;
    result.push({ fecha: fechaStr, conteo });
  }

  return result;
}

// ── Horarios demand ranking ─────────────────────────────────────────────

/**
 * Calculates top 5 most demanded time slots.
 * Returns max 5 elements, sorted descending by porcentajePromedio.
 */
export function calcularHorariosDemanda(horarios: Horario[]): HorarioDemanda[] {
  // Group by hora
  const byHora = new Map<string, { totalOcupacion: number; count: number }>();
  for (const h of horarios) {
    if (!h.cupos || h.cupos <= 0) continue;
    const pct = calcularOcupacion(h.cupos, h.cuposDisponibles ?? 0);
    const prev = byHora.get(h.hora) || { totalOcupacion: 0, count: 0 };
    byHora.set(h.hora, { totalOcupacion: prev.totalOcupacion + pct, count: prev.count + 1 });
  }

  const result: HorarioDemanda[] = [];
  for (const [hora, data] of byHora) {
    const porcentajePromedio = Math.round(data.totalOcupacion / data.count);
    result.push({
      hora,
      porcentajePromedio,
      nivelDemanda: badgeDemanda(porcentajePromedio)
    });
  }

  return result
    .sort((a, b) => b.porcentajePromedio - a.porcentajePromedio)
    .slice(0, 5);
}

// ── Planes por vencer ────────────────────────────────────────────────────

/**
 * Filters users with plans expiring in the next 7 days.
 * Returns clients sorted ascending by diasRestantes.
 */
export function calcularPlanesPorVencer(usuarios: any[], hoy: string): ClientePlanVence[] {
  const hoyDate = new Date(hoy + 'T00:00:00');
  const limite = new Date(hoy + 'T00:00:00');
  limite.setDate(limite.getDate() + 7);

  const result: ClientePlanVence[] = [];
  for (const u of usuarios) {
    if (!u.vigenciaFin) continue;
    const fin = new Date(u.vigenciaFin + 'T00:00:00');
    if (fin >= hoyDate && fin <= limite) {
      const diasRestantes = Math.round((fin.getTime() - hoyDate.getTime()) / 86400000);
      result.push({
        uid: u.uid,
        nombreCompleto: u.nombre || u.displayName || u.email || 'Sin nombre',
        planActivo: u.planActivo || 'Sin plan',
        vigenciaFin: u.vigenciaFin,
        diasRestantes
      });
    }
  }

  return result.sort((a, b) => a.diasRestantes - b.diasRestantes);
}

// ── Clientes inactivos ───────────────────────────────────────────────────

/**
 * Returns up to 10 clients with active plans who haven't attended in >15 days.
 * Sorted descending by diasInactividad.
 */
export function calcularClientesInactivos(
  clientes: any[],
  reservas: Reserva[],
  hoy: string
): ClienteInactivo[] {
  const hoyDate = new Date(hoy + 'T00:00:00');
  const UMBRAL_DIAS = 15;

  const result: ClienteInactivo[] = [];

  for (const c of clientes) {
    if (!c.planActivo) continue;

    // Find last confirmed reservation for this client
    const reservasCliente = reservas
      .filter(r => r.userId === c.uid && r.estado === 'confirmada')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let ultimaSesion: string | null = null;
    let refDate: Date;

    if (reservasCliente.length > 0) {
      ultimaSesion = reservasCliente[0].createdAt;
      refDate = new Date(ultimaSesion);
    } else {
      // No reservations: use plan start date if available
      if (c.vigenciaInicio) {
        refDate = new Date(c.vigenciaInicio + 'T00:00:00');
      } else {
        continue; // Can't determine inactivity
      }
    }

    const diasInactividad = Math.floor(
      (hoyDate.getTime() - refDate.getTime()) / 86400000
    );

    if (diasInactividad > UMBRAL_DIAS) {
      result.push({
        uid: c.uid,
        nombreCompleto: c.nombre || c.displayName || c.email || 'Sin nombre',
        planActivo: c.planActivo,
        diasInactividad,
        ultimaSesion
      });
    }
  }

  return result
    .sort((a, b) => b.diasInactividad - a.diasInactividad)
    .slice(0, 10);
}

// ── Pago mapper ──────────────────────────────────────────────────────────

export function mapearPagosAdmin(pagos: Pago[]): any[] {
  return pagos.map(p => ({
    id: p.id,
    clienteNombre: (p as any).clienteNombre || 'Cliente',
    planNombre: p.planNombre,
    monto: p.monto,
    estado: p.estado,
    createdAt: p.createdAt
  }));
}
