// src/app/admin/admin.models.ts
// Dashboard-specific TypeScript interfaces for GymOlimpo Admin Dashboard

import { Horario, Reserva, Pago } from '../services/gym.service';

// ── KPI ───────────────────────────────────────────────────────────────
export interface KpiCardConfig {
  id: string;
  label: string;
  value: number | string;
  icon: string;
  colorClass: 'success' | 'warning' | 'danger' | 'neutral';
  tendencia?: TendenciaKpi;
  loading: boolean;
  formato?: 'numero' | 'porcentaje' | 'moneda';
}

export interface TendenciaKpi {
  tipo: 'sube' | 'baja' | 'igual';
  porcentaje: number;
}

// ── Alertas ───────────────────────────────────────────────────────────
export type AlertaCategoria = 'urgente' | 'advertencia' | 'informativa';

export interface AlertaAdmin {
  id: string;
  categoria: AlertaCategoria;
  descripcion: string;
  conteo: number;
  rutaAccion: string;
  icono: string;
}

// ── Gráficos ──────────────────────────────────────────────────────────
export interface ChartBarData {
  label: string;
  value: number;
}

export interface ChartLineData {
  fecha: string;
  conteo: number;
}

// ── Calendario ───────────────────────────────────────────────────────
export type EstadoBloque = 'libre' | 'parcial' | 'casi-lleno' | 'lleno';

export interface BloqueCalendario {
  horarioId: string;
  hora: string;
  cupos: number;
  cuposDisponibles: number;
  porcentajeOcupacion: number;
  estado: EstadoBloque;
  clientes: string[];
}

// ── Pagos (panel dashboard) ───────────────────────────────────────────
export interface PagoAdmin {
  id: string;
  clienteNombre: string;
  planNombre: string;
  monto: number;
  estado: 'pendiente' | 'validado' | 'cancelado';
  createdAt: string;
}

// ── Planes por vencer ────────────────────────────────────────────────
export interface ClientePlanVence {
  uid: string;
  nombreCompleto: string;
  planActivo: string;
  vigenciaFin: string;
  diasRestantes: number;
}

// ── Clientes inactivos ───────────────────────────────────────────────
export interface ClienteInactivo {
  uid: string;
  nombreCompleto: string;
  planActivo: string;
  diasInactividad: number;
  ultimaSesion: string | null;
}

// ── Horarios más demandados ───────────────────────────────────────────
export interface HorarioDemanda {
  hora: string;
  porcentajePromedio: number;
  nivelDemanda: 'alta' | 'media' | 'baja';
}

// ── Dashboard state ───────────────────────────────────────────────────
export interface DashboardState {
  kpis: KpiCardConfig[];
  alertas: AlertaAdmin[];
  chartOcupacion: ChartBarData[];
  chartReservasSemana: ChartLineData[];
  chartTopHorarios: ChartBarData[];
  bloques: BloqueCalendario[];
  reservasRecientes: Reserva[];
  pagosRecientes: PagoAdmin[];
  planesPorVencer: ClientePlanVence[];
  clientesInactivos: ClienteInactivo[];
  horariosDemanda: HorarioDemanda[];
  cargando: boolean;
  error: string | null;
}

export function initialDashboardState(): DashboardState {
  return {
    kpis: [
      { id: 'clientes-activos', label: 'Clientes Activos', value: 0, icon: 'people-outline', colorClass: 'success', loading: true, formato: 'numero' },
      { id: 'reservas-hoy', label: 'Reservas de Hoy', value: 0, icon: 'calendar-outline', colorClass: 'success', loading: true, formato: 'numero' },
      { id: 'ingresos-mes', label: 'Ingresos del Mes', value: 0, icon: 'cash-outline', colorClass: 'neutral', loading: true, formato: 'moneda' },
      { id: 'pagos-pendientes', label: 'Pagos Pendientes', value: 0, icon: 'card-outline', colorClass: 'warning', loading: true, formato: 'numero' },
      { id: 'planes-por-vencer', label: 'Planes por Vencer', value: 0, icon: 'alert-circle-outline', colorClass: 'warning', loading: true, formato: 'numero' },
      { id: 'ocupacion-semanal', label: 'Ocupación Hoy', value: 0, icon: 'stats-chart-outline', colorClass: 'neutral', loading: true, formato: 'porcentaje' }
    ],
    alertas: [],
    chartOcupacion: [],
    chartReservasSemana: [],
    chartTopHorarios: [],
    bloques: [],
    reservasRecientes: [],
    pagosRecientes: [],
    planesPorVencer: [],
    clientesInactivos: [],
    horariosDemanda: [],
    cargando: true,
    error: null
  };
}
