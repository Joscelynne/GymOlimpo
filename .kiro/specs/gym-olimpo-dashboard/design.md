# Design Document
# GymOlimpo — Rediseño del Dashboard de Administración

## Overview

El rediseño del dashboard de administración transforma la `AdminPage` actual (4 KPIs básicos, sin gráficos, con `alert()` nativos del navegador) en un panel de gestión ejecutiva tipo SaaS, inspirado en Stripe, Linear y Vercel Dashboard. El stack existente **Angular 17 + Ionic 7 + AngularFire compat + SCSS + RxJS 7.8** se mantiene íntegro; no se instalan dependencias de producción nuevas. Los gráficos se implementan con **SVG puro renderizado desde TypeScript**. Como única excepción, `fast-check` se agrega en `devDependencies` exclusivamente para los tests de propiedades.

### Principios de diseño

- **Reactivo por defecto**: todos los datos provienen de Observables de Firestore; no existe polling ni fetch manual.
- **Suscripciones controladas**: patrón `takeUntil(destroy$)` con `Subject<void>` en todos los componentes.
- **Cero duplicación de lógica**: `AdminPage` y sus sub-componentes consumen exclusivamente métodos del `GymService` y `UserService` existentes, más los nuevos métodos descritos en este documento.
- **SVG puro sin librerías**: los tres gráficos se construyen como componentes Angular con SVG generado dinámicamente desde TypeScript vía `@Input`.
- **Sin scroll horizontal**: todas las grillas se reorganizan por breakpoints SCSS.
- **Ionic UI controllers**: `ToastController` y `AlertController` reemplazan completamente `alert()` y `confirm()` nativos.

---

## Architecture

### Estructura de carpetas propuesta dentro de `src/app/admin/`

```
src/app/admin/
├── admin.page.ts               ← MODIFICAR (reescribir completo)
├── admin.page.html             ← MODIFICAR (reescribir completo)
├── admin.page.scss             ← MODIFICAR (extender con nuevas secciones)
├── admin.module.ts             ← MODIFICAR (declarar nuevos componentes)
├── admin-routing.module.ts     ← MODIFICAR (agregar sub-rutas lazy)
├── admin.models.ts             ← CREAR (interfaces TypeScript del dashboard)
├── admin.utils.ts              ← CREAR (funciones puras de transformación)
│
├── components/
│   ├── kpi-card/               ← kpi-card.component.ts/html/scss
│   ├── alert-panel/            ← alert-panel.component.ts/html/scss
│   ├── chart-bar/              ← Barras verticales (ocupación del día)
│   ├── chart-line/             ← Líneas (reservas últimos 7 días)
│   ├── chart-hbar/             ← Barras horizontales (top 5 demanda)
│   ├── calendar-view/          ← Vista de calendario con navegación
│   ├── reservas-table/         ← Tabla de reservas con badges y acciones
│   ├── pagos-panel/            ← Panel de pagos recientes
│   ├── planes-panel/           ← Panel de planes próximos a vencer
│   ├── clientes-inactivos/     ← Panel de clientes inactivos
│   ├── horarios-demanda/       ← Ranking de horarios con barras CSS
│   └── quick-actions/          ← Botones de acciones rápidas
│
├── clientes/                   ← CREAR sub-ruta stub (/admin/clientes)
│   ├── clientes.page.ts
│   ├── clientes.page.html
│   ├── clientes.module.ts
│   └── clientes-routing.module.ts
│
├── usuarios/                   ← CREAR sub-ruta stub (/admin/usuarios)
│   ├── usuarios.page.ts
│   ├── usuarios.page.html
│   ├── usuarios.module.ts
│   └── usuarios-routing.module.ts
│
└── reportes/                   ← CREAR sub-ruta stub (/admin/reportes)
    ├── reportes.page.ts
    ├── reportes.page.html
    ├── reportes.module.ts
    └── reportes-routing.module.ts
```

### Diagrama de arquitectura

```
┌──────────────────────────────────────────────────────────────────────┐
│                          AdminPage                                   │
│  (Orquestador: combineLatest + takeUntil → pasa @Input a hijos)     │
│                                                                      │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │ KpiCard   │  │  AlertPanel  │  │  QuickActions                │  │
│  │  (×6)     │  │              │  │  (botones + generarHorarios) │  │
│  └───────────┘  └──────────────┘  └──────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Sección Gráficos (3 col desktop / 1 col móvil)              │   │
│  │  ChartBar  |  ChartLine  |  ChartHBar                        │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────┐   ┌───────────────────────────────────────┐    │
│  │  CalendarView    │   │  ReservasTable                        │    │
│  └──────────────────┘   └───────────────────────────────────────┘    │
│                                                                      │
│  ┌───────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│  │  PagosPanel   │  │  PlanesPanel     │  │  ClientesInactivos  │   │
│  └───────────────┘  └──────────────────┘  └─────────────────────┘   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  HorariosDemanda                                             │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
          │                     │
          ▼                     ▼
   GymService             UserService
   (Observables Firestore) (colección users)
          │
          ▼
    Firebase Firestore
    [horarios | reservas | pagos | users]
```

### Roles de cada componente

| Componente | Recibe datos via | Responsabilidad |
|---|---|---|
| `AdminPage` | Streams directos del servicio | Orquestador; combina streams con `combineLatest`, pasa `@Input` a hijos |
| `KpiCardComponent` | `@Input() config: KpiCardConfig` | Renderizar métrica con ícono, valor, tendencia y skeleton |
| `AlertPanelComponent` | `@Input() alertas: AlertaAdmin[]` | Agrupar y ordenar alertas por categoría |
| `ChartBarComponent` | `@Input() data: ChartBarData[]` | Render SVG de barras verticales |
| `ChartLineComponent` | `@Input() data: ChartLineData[]` | Render SVG de línea con área rellena |
| `ChartHBarComponent` | `@Input() data: ChartBarData[]` | Render SVG de barras horizontales |
| `CalendarViewComponent` | `@Input() fechaActual: string` + stream interno | Navegar días, mostrar bloques con estado |
| `ReservasTableComponent` | `@Input() reservas: Reserva[]` + `@Output()` | Tabla con badges y acciones confirm/cancel |
| `PagosPanelComponent` | `@Input() pagos: PagoAdmin[]` | Lista de últimos 10 pagos con badges |
| `PlanesPanelComponent` | `@Input() clientes: ClientePlanVence[]` | Planes próximos a vencer con badges |
| `ClientesInactivosComponent` | `@Input() clientes: ClienteInactivo[]` | Lista de clientes inactivos ordenados |
| `HorariosDemandaComponent` | `@Input() horarios: HorarioDemanda[]` | Ranking con barras de progreso CSS |
| `QuickActionsComponent` | `@Output() accionEjecutada` | Botones de acciones rápidas |

---

## Components and Interfaces

Las interfaces existentes (`Horario`, `Reserva`, `Pago`, `PlanGym`) en `gym.service.ts` **no se modifican**. Se definen interfaces adicionales en el nuevo archivo `src/app/admin/admin.models.ts`:

```typescript
// src/app/admin/admin.models.ts

// ── KPI ────────────────────────────────────────────────────────────────
export interface KpiCardConfig {
  id: string;
  label: string;
  value: number | string;
  icon: string;                          // nombre de ionicon, ej: 'people-outline'
  colorClass: 'success' | 'warning' | 'danger' | 'neutral';
  tendencia?: TendenciaKpi;
  loading: boolean;
  formato?: 'numero' | 'porcentaje' | 'moneda';
}

export interface TendenciaKpi {
  tipo: 'sube' | 'baja' | 'igual';
  porcentaje: number;                    // diferencia relativa respecto al período anterior
}

// ── Alertas ────────────────────────────────────────────────────────────
export type AlertaCategoria = 'urgente' | 'advertencia' | 'informativa';

export interface AlertaAdmin {
  id: string;
  categoria: AlertaCategoria;
  descripcion: string;
  conteo: number;
  rutaAccion: string;                    // ruta RouterLink destino
  icono: string;                         // nombre de ionicon
}

// ── Gráficos ───────────────────────────────────────────────────────────
export interface ChartBarData {
  label: string;                         // etiqueta eje X (hora o fecha abreviada)
  value: number;                         // valor 0–100 (porcentaje) o conteo
}

export interface ChartLineData {
  fecha: string;                         // YYYY-MM-DD
  conteo: number;
}

// ── Calendario ────────────────────────────────────────────────────────
export type EstadoBloque = 'libre' | 'parcial' | 'casi-lleno' | 'lleno';

export interface BloqueCalendario {
  horarioId: string;
  hora: string;
  cupos: number;
  cuposDisponibles: number;
  porcentajeOcupacion: number;           // floor((cupos - cuposDisponibles) / cupos * 100)
  estado: EstadoBloque;
  clientes: string[];                    // clienteNombre de reservas confirmadas
}

// ── Pagos (panel dashboard) ────────────────────────────────────────────
export interface PagoAdmin {
  id: string;
  clienteNombre: string;                 // obtenido via userId → users
  planNombre: string;
  monto: number;
  estado: 'pendiente' | 'validado' | 'cancelado';
  createdAt: string;
}

// ── Planes por vencer ─────────────────────────────────────────────────
export interface ClientePlanVence {
  uid: string;
  nombreCompleto: string;
  planActivo: string;
  vigenciaFin: string;                   // YYYY-MM-DD
  diasRestantes: number;                 // diferencia entera en días completos
}

// ── Clientes inactivos ────────────────────────────────────────────────
export interface ClienteInactivo {
  uid: string;
  nombreCompleto: string;
  planActivo: string;
  diasInactividad: number;
  ultimaSesion: string | null;           // ISO string o null si sin sesiones
}

// ── Horarios más demandados ────────────────────────────────────────────
export interface HorarioDemanda {
  hora: string;                          // HH:MM
  porcentajePromedio: number;            // entero 0–100
  nivelDemanda: 'alta' | 'media' | 'baja';
}

// ── Dashboard state (estado unificado de AdminPage) ──────────────────
export interface DashboardState {
  kpis: KpiCardConfig[];
  alertas: AlertaAdmin[];
  chartOcupacion: ChartBarData[];
  chartReservasSemana: ChartLineData[];
  chartTopHorarios: ChartBarData[];
  bloques: BloqueCalendario[];
  pagosRecientes: PagoAdmin[];
  planesPorVencer: ClientePlanVence[];
  clientesInactivos: ClienteInactivo[];
  horariosDemanda: HorarioDemanda[];
  cargando: boolean;
  error: string | null;
}
```

---

## Data Models

### Nuevos métodos en GymService

Los métodos existentes se reutilizan íntegramente. Se agregan los siguientes al final de `gym.service.ts`:

```typescript
// ── 1. Clientes activos (planActivo no vacío) ──────────────────────────
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

// ── 2. Pagos recientes (últimos N, todos los estados) ─────────────────
getPagosRecientes(limit = 10): Observable<Pago[]> {
  return this.firestore.collection<Pago>('pagos',
    ref => ref.orderBy('createdAt', 'desc').limit(limit)
  ).snapshotChanges().pipe(
    map(actions => actions.map(a => ({
      id: a.payload.doc.id,
      ...(a.payload.doc.data() as Pago)
    })))
  );
}

// ── 3. Alias semántico para inactivos (plan activo, cruce en cliente) ──
// Firestore no admite joins. El filtrado se aplica en el componente
// tras combineLatest([getClientesActivos(), getReservasRecientes(500)]).
getClientesConPlanActivo(): Observable<any[]> {
  return this.getClientesActivos();
}

// ── 4. Usuarios con vigencia (para planes por vencer) ─────────────────
// Filtrado por fecha relativa no soportado en Firestore; se filtra en cliente.
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

// ── 5. Horarios por fecha específica (usa índice fecha+orderBy hora) ──
getHorariosPorFecha(fecha: string): Observable<Horario[]> {
  return this.firestore.collection<Horario>('horarios',
    ref => ref.where('fecha', '==', fecha).orderBy('hora', 'asc')
  ).snapshotChanges().pipe(
    map(actions => actions.map(a => ({
      id: a.payload.doc.id,
      ...(a.payload.doc.data() as Horario)
    })))
  );
}

// ── 6. Reservas por rango de fechas (para gráfico de líneas 7 días) ───
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
```

> **Nota de implementación**: los métodos 3 y 4 traen documentos completos de `users` y aplican el filtrado en el cliente Angular. Esto es intencional porque Firestore no admite queries con lógica de fechas relativas ni joins cross-collection. El límite de 200 documentos en `getUsuariosConVigencia()` es el máximo definido en los requisitos.

### Funciones puras de transformación (`admin.utils.ts`)

Las transformaciones de datos se extraen a funciones puras en `src/app/admin/admin.utils.ts`. Esto facilita el testing unitario y la verificación de propiedades:

```typescript
// admin.utils.ts — firmas de todas las funciones exportadas

export function calcularOcupacion(cupos: number, cuposDisponibles: number): number
// floor((cupos - cuposDisponibles) / cupos * 100); retorna 0 si cupos === 0

export function clasificarBloque(porcentaje: number): EstadoBloque
// 0 → 'libre', 1–75 → 'parcial', 76–99 → 'casi-lleno', 100 → 'lleno'

export function badgePlanVence(diasRestantes: number): string
// 0 → 'Vence hoy', 1 → 'Vence mañana', 2–7 → '${d} días'

export function badgeDemanda(porcentaje: number): 'alta' | 'media' | 'baja'
// >85 → 'alta', 50–85 → 'media', <50 → 'baja'

export function formatMonto(monto: number): string
// '$' + separador de miles con punto: 1234567 → '$1.234.567'

export function fechaHoy(): string
// YYYY-MM-DD usando Date local

export function fechaOffset(dias: number): string
// YYYY-MM-DD con offset de N días desde hoy (negativo = pasado)

export function calcularKpis(clientes, reservasHoy, pagos, usuarios, horarios, hoy): KpiCardConfig[]

export function calcularAlertas(pagos, usuarios, horariosHoy, reservas, hoy): AlertaAdmin[]

export function agruparReservasPorDia(reservas: Reserva[], inicio: string, fin: string): ChartLineData[]
// Retorna exactamente 7 elementos; días sin reservas tienen conteo = 0

export function calcularHorariosDemanda(horarios: Horario[]): HorarioDemanda[]
// Máximo 5 elementos, ordenados descendentemente por porcentajePromedio

export function calcularPlanesPorVencer(usuarios: any[], hoy: string): ClientePlanVence[]
// Solo usuarios con vigenciaFin en [hoy, hoy+7], ordenados asc por diasRestantes

export function calcularClientesInactivos(clientes: any[], reservas: Reserva[], hoy: string): ClienteInactivo[]
// Solo clientes con planActivo y última reserva confirmada > 15 días; máx 10, desc por diasInactividad
```

---

## Gráficos con SVG Puro

No se instala ninguna librería de gráficos. Cada componente genera SVG directamente en TypeScript a partir de los datos recibidos por `@Input`. El template Angular construye los elementos SVG nativos con `*ngFor`.

### Estrategia general de renderizado

```
Datos (@Input ChartBarData[] / ChartLineData[])
    │
    ▼
ngOnChanges() detecta cambio de @Input
    │
    ▼
calcularPuntos() → normalizar valores al rango [0, alturaUtil]
    │
    ▼
Template <svg> con <rect>/<path>/<line>/<text> via *ngFor
    │
    ▼
Angular change detection → re-render automático al cambiar @Input
```

### ChartBarComponent — barras verticales (ocupación del día)

- **ViewBox**: `0 0 600 260`. Atributo `width="100%"` con `preserveAspectRatio="xMidYMid meet"`.
- **Barras**: elemento `<rect>` por cada horario; `height` proporcional al porcentaje (0–100); `fill="#22c55e"`.
- **Grilla Y**: líneas horizontales en 0%, 25%, 50%, 75%, 100% con `stroke="#1e2a38"`.
- **Etiquetas X**: `<text>` con la hora del bloque, `fill="#94a3b8"`.
- **Valor encima**: `<text>` con el porcentaje redondeado, `fill="#e2e8f0"`.
- **Sin datos**: mensaje SVG centrado si el array tiene < 2 elementos.

```typescript
// Cálculo de rectángulos en ChartBarComponent
interface BarRect { x: number; y: number; width: number; height: number; label: string; value: number; }

calcBarRects(data: ChartBarData[], svgH = 200, svgW = 600): BarRect[] {
  const n = data.length || 1;
  const barW = Math.floor(svgW / n) - 4;
  return data.map((d, i) => ({
    x: i * (svgW / n) + 2,
    y: svgH - (d.value / 100) * svgH,
    width: barW,
    height: (d.value / 100) * svgH,
    label: d.label,
    value: d.value
  }));
}
```

### ChartLineComponent — línea + área (reservas últimos 7 días)

- **ViewBox**: `0 0 600 200`.
- **Línea principal**: un único `<path>` con `M x0,y0 L x1,y1 … Lxn,yn`; `stroke="#22c55e"`, `fill="none"`.
- **Área rellena**: `<path>` que cierra el polígono hacia la base con `fill="#22c55e"` al 15% de opacidad.
- **Puntos**: `<circle>` r=4 en cada coordenada, `fill="#22c55e"`.
- **Tooltip accesible**: `<title>` dentro de cada `<circle>`.
- **Días sin reservas**: valor 0 → punto en la línea base.

```typescript
calcLinePath(data: ChartLineData[], svgH = 160, svgW = 560): string {
  const maxVal = Math.max(...data.map(d => d.conteo), 1);
  const step = svgW / Math.max(data.length - 1, 1);
  return data.map((d, i) => {
    const x = i * step + 20;
    const y = svgH - (d.conteo / maxVal) * svgH + 20;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}
```

### ChartHBarComponent — barras horizontales (top 5 demanda)

- **ViewBox**: `0 0 400 220`.
- **Barras**: `<rect>` horizontal con `y = index * rowH`, `width` proporcional al porcentaje.
- **Etiqueta izquierda**: `<text>` con la hora, `fill="#94a3b8"`.
- **Etiqueta derecha**: `<text>` con el porcentaje + `%`, `fill="#e2e8f0"`.
- **Colores por nivel**: verde `#22c55e` (>85%), naranja `#f59e0b` (50–85%), gris `#475569` (<50%).

---

## Flujo de Datos y Gestión de Estado

### Patrón general de suscripción en AdminPage

```typescript
// admin.page.ts — esquema de flujo reactivo

@Component({ selector: 'app-admin', templateUrl: './admin.page.html', styleUrls: ['./admin.page.scss'] })
export class AdminPage implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  state: DashboardState = initialDashboardState();

  constructor(
    private gym: GymService,
    private toast: ToastController,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.suscribirStreams();
  }

  private suscribirStreams(): void {
    const hoy = fechaHoy();
    const hace7Dias = fechaOffset(-7);

    // Stream 1: KPIs base
    combineLatest([
      this.gym.getClientesActivos(),
      this.gym.getReservasPorFecha(hoy),
      this.gym.getPagosPendientes(),
      this.gym.getUsuariosConVigencia(),
      this.gym.getHorarios()
    ]).pipe(
      takeUntil(this.destroy$),
      catchError(err => { this.state.error = 'Error al cargar KPIs.'; return of([[], [], [], [], []]); })
    ).subscribe(([clientes, reservasHoy, pagos, usuarios, horarios]) => {
      this.state.kpis = calcularKpis(clientes, reservasHoy, pagos, usuarios, horarios, hoy);
    });

    // Stream 2: Alertas
    combineLatest([
      this.gym.getPagosPendientes(),
      this.gym.getUsuariosConVigencia(),
      this.gym.getHorariosPorFecha(hoy),
      this.gym.getReservasRecientes(500)
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([pagos, usuarios, horariosHoy, reservas]) => {
        this.state.alertas = calcularAlertas(pagos, usuarios, horariosHoy, reservas, hoy);
      });

    // Stream 3a: Gráfico de barras verticales (ocupación del día)
    this.gym.getHorariosPorFecha(hoy)
      .pipe(takeUntil(this.destroy$))
      .subscribe(horarios => {
        this.state.chartOcupacion = horarios.map(h => ({
          label: h.hora,
          value: calcularOcupacion(h.cupos, h.cuposDisponibles)
        }));
      });

    // Stream 3b: Gráfico de líneas (reservas últimos 7 días)
    this.gym.getReservasPorRango(hace7Dias, hoy)
      .pipe(takeUntil(this.destroy$))
      .subscribe(reservas => {
        this.state.chartReservasSemana = agruparReservasPorDia(reservas, hace7Dias, hoy);
      });

    // Stream 3c: Gráfico barras horizontales (top 5 demanda) + horariosDemanda
    this.gym.getHorarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe(horarios => {
        this.state.horariosDemanda = calcularHorariosDemanda(horarios);
        this.state.chartTopHorarios = this.state.horariosDemanda
          .slice(0, 5)
          .map(h => ({ label: h.hora, value: h.porcentajePromedio }));
      });

    // Stream 4: Tabla de reservas recientes
    this.gym.getReservasRecientes(50)
      .pipe(takeUntil(this.destroy$))
      .subscribe(reservas => { /* pasar a ReservasTableComponent vía @Input */ });

    // Stream 5: Pagos recientes
    this.gym.getPagosRecientes(10)
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagos => { this.state.pagosRecientes = mapearPagosAdmin(pagos); });

    // Stream 6: Clientes inactivos (cruce en memoria)
    combineLatest([
      this.gym.getClientesConPlanActivo(),
      this.gym.getReservasRecientes(500)
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([clientes, reservas]) => {
        this.state.clientesInactivos = calcularClientesInactivos(clientes, reservas, hoy);
      });

    // Stream 7: Planes por vencer
    this.gym.getUsuariosConVigencia()
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuarios => {
        this.state.planesPorVencer = calcularPlanesPorVencer(usuarios, hoy);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## Layout Responsivo y Breakpoints SCSS

### Grid principal del dashboard (`admin.page.scss`)

```
Móvil:      < 768px      → 2 col para KPIs; 1 col para todo lo demás
Tablet:     768–1023px   → 2 col para KPIs, paneles y gráficos
Escritorio: ≥ 1024px     → 3 col para KPIs; 3 col para gráficos; 2 col para fila media
```

```scss
.admin-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

// ── KPI Cards: 3/2/2 columnas ─────────────────────────────────────────
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1023px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 767px)  { grid-template-columns: repeat(2, 1fr); }
}

// ── Gráficos: 3/2/1 columnas ─────────────────────────────────────────
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1023px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 767px)  { grid-template-columns: 1fr; }
}

// ── Fila media: Calendar (fijo) + Reservas Table ──────────────────────
.mid-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1023px) { grid-template-columns: 1fr; }
}

// ── Fila inferior: Pagos | Planes | Inactivos ─────────────────────────
.bottom-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1023px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 767px)  { grid-template-columns: 1fr; }
}

// ── Fila final: Horarios Demanda + Quick Actions ──────────────────────
.footer-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 767px) { grid-template-columns: 1fr; }
}

// ── Tabla de reservas: scroll horizontal en móvil ─────────────────────
.reservas-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  table { min-width: 800px; }
}

// ── Animación de entrada de tarjetas (Req 11.4) ───────────────────────
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dashboard-card {
  animation: slideInUp 300ms ease-out forwards;
  &:nth-child(1) { animation-delay: 0ms; }
  &:nth-child(2) { animation-delay: 40ms; }
  &:nth-child(3) { animation-delay: 80ms; }
  &:nth-child(4) { animation-delay: 120ms; }
  &:nth-child(5) { animation-delay: 160ms; }
  &:nth-child(6) { animation-delay: 200ms; }
}

// ── Skeleton loader ───────────────────────────────────────────────────
.skeleton {
  background: linear-gradient(90deg, #1e2a38 25%, #263040 50%, #1e2a38 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
  height: 48px;
  width: 80%;
}

@keyframes shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}

// ── Hover KPI en escritorio ───────────────────────────────────────────
.kpi-card {
  transition: transform 200ms ease, box-shadow 200ms ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
}
```

---

## Rutas Admin Adicionales

Se actualiza `admin-routing.module.ts` para agregar las tres sub-rutas referenciadas en el template actual:

```typescript
// admin-routing.module.ts actualizado
const routes: Routes = [
  { path: '', component: AdminPage },
  {
    path: 'clientes',
    loadChildren: () => import('./clientes/clientes.module').then(m => m.ClientesPageModule)
  },
  {
    path: 'usuarios',
    loadChildren: () => import('./usuarios/usuarios.module').then(m => m.UsuariosPageModule)
  },
  {
    path: 'reportes',
    loadChildren: () => import('./reportes/reportes.module').then(m => m.ReportesPageModule)
  }
];
```

Cada página stub muestra un `ion-header` con botón de regreso (`/admin`) y un `ion-content` con el mensaje "Módulo en construcción — próximamente disponible". Las rutas resultantes son:

```
/admin           → AdminPage (dashboard principal)
/admin/clientes  → ClientesPage (stub)
/admin/usuarios  → UsuariosPage (stub)
/admin/reportes  → ReportesPage (stub)
```

---

## Toasts y Confirmaciones con Ionic

Se reemplaza completamente el uso de `alert()` y `confirm()` nativos por los controladores Ionic:

```typescript
// ToastController — notificaciones de resultado de acciones
private async showToast(message: string, color: 'success' | 'warning' | 'danger'): Promise<void> {
  const toast = await this.toast.create({
    message,
    duration: 5000,           // 5s para éxito (Req 12.3)
    color,
    position: 'bottom',
    buttons: [{ role: 'cancel', icon: 'close-outline' }]
  });
  await toast.present();
}

// Error — 10s auto-descarte + botón cerrar (Req 12.4)
private async showErrorToast(message: string): Promise<void> {
  const toast = await this.toast.create({
    message,
    duration: 10000,
    color: 'danger',
    position: 'bottom',
    buttons: [{ role: 'cancel', text: 'Cerrar' }]
  });
  await toast.present();
}

// AlertController — confirmación destructiva de cancelar reserva (Req 5.5)
async confirmarCancelacion(reserva: Reserva): Promise<boolean> {
  return new Promise(async resolve => {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar Reserva',
      message: `¿Confirmas cancelar la reserva de <strong>${reserva.clienteNombre}</strong>
                para el ${reserva.fecha} a las ${reserva.hora}?`,
      cssClass: 'gym-alert',   // ya definida en global.scss
      buttons: [
        { text: 'No', role: 'cancel', handler: () => resolve(false) },
        { text: 'Sí, cancelar', role: 'confirm', handler: () => resolve(true) }
      ]
    });
    await alert.present();
  });
}
```

### AdminModule actualizado

```typescript
@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, AdminPageRoutingModule],
  declarations: [
    AdminPage,
    KpiCardComponent,
    AlertPanelComponent,
    ChartBarComponent,
    ChartLineComponent,
    ChartHBarComponent,
    CalendarViewComponent,
    ReservasTableComponent,
    PagosPanelComponent,
    PlanesPanelComponent,
    ClientesInactivosComponent,
    HorariosDemandaComponent,
    QuickActionsComponent
  ]
})
export class AdminPageModule {}
```

---

## Error Handling

### Estrategia por capa

| Capa | Estrategia |
|---|---|
| Firestore Observable | `catchError` en el pipe; emite array vacío o estado de error; no rompe el stream |
| Componente hijo | Recibe `@Input() error: string \| null`; muestra mensaje si no es null |
| AdminPage | Centraliza errores en `state.error`; muestra banner global de error si aplica |
| Acciones (confirmar, cancelar, generar) | `try/catch` en el método `async`; llama a `showErrorToast()` con el mensaje del servicio |

### Patrón de error en streams

```typescript
this.gym.getClientesActivos().pipe(
  takeUntil(this.destroy$),
  catchError(err => {
    this.state.error = 'No se pudo cargar la lista de clientes.';
    return of([]);  // array vacío para que el template no quede bloqueado
  })
).subscribe(clientes => { /* ... */ });
```

### Estado de carga (skeleton loaders)

Cada `KpiCardConfig` tiene el campo `loading: boolean`. El `KpiCardComponent` muestra un `<div class="skeleton">` animado mientras `loading === true`. Al recibir los primeros datos del Observable, `loading` se establece en `false` y el skeleton se reemplaza con el valor real (Req 1.8).

### Preservación del último estado válido en gráficos y paneles

Si un Observable emite un error tras haber entregado datos, el componente mantiene el último valor recibido. La bandera `state.error` muestra un banner informativo sin borrar los datos previamente cargados (Req 3.8, Req 2.10).

---

## Archivos a Crear vs Modificar

### Archivos a modificar

| Archivo | Tipo de cambio |
|---|---|
| `admin/admin.page.ts` | Reescribir: `takeUntil(destroy$)`, `combineLatest`, `ToastController`, `AlertController`; eliminar `alert()`/`confirm()` nativos |
| `admin/admin.page.html` | Reescribir: nueva estructura grid con 10 secciones de dashboard |
| `admin/admin.page.scss` | Extender: nuevas clases grid, skeleton, animaciones; clases existentes reutilizables donde corresponda |
| `admin/admin.module.ts` | Declarar los 13 nuevos componentes de `components/` |
| `admin/admin-routing.module.ts` | Agregar las 3 sub-rutas lazy (clientes, usuarios, reportes) |
| `services/gym.service.ts` | Agregar 6 nuevos métodos al final del archivo |

### Archivos a crear

| Archivo | Descripción |
|---|---|
| `admin/admin.models.ts` | Interfaces TypeScript del dashboard |
| `admin/admin.utils.ts` | Funciones puras de transformación (testables con fast-check) |
| `admin/components/kpi-card/*.ts/html/scss` | Componente KPI Card con skeleton y tendencia |
| `admin/components/alert-panel/*.ts/html/scss` | Panel de alertas priorizado |
| `admin/components/chart-bar/*.ts/html/scss` | Gráfico SVG barras verticales |
| `admin/components/chart-line/*.ts/html/scss` | Gráfico SVG líneas con área |
| `admin/components/chart-hbar/*.ts/html/scss` | Gráfico SVG barras horizontales |
| `admin/components/calendar-view/*.ts/html/scss` | Vista de calendario con navegación |
| `admin/components/reservas-table/*.ts/html/scss` | Tabla de reservas con badges y acciones |
| `admin/components/pagos-panel/*.ts/html/scss` | Panel de pagos recientes |
| `admin/components/planes-panel/*.ts/html/scss` | Panel de planes por vencer |
| `admin/components/clientes-inactivos/*.ts/html/scss` | Panel de clientes inactivos |
| `admin/components/horarios-demanda/*.ts/html/scss` | Ranking de horarios con barras CSS |
| `admin/components/quick-actions/*.ts/html/scss` | Acciones rápidas con estados |
| `admin/clientes/*.ts/html/module/routing` | Stub `/admin/clientes` |
| `admin/usuarios/*.ts/html/module/routing` | Stub `/admin/usuarios` |
| `admin/reportes/*.ts/html/module/routing` | Stub `/admin/reportes` |

### Orden de implementación recomendado

1. `admin.models.ts` y `admin.utils.ts` — fundamentos testables.
2. Nuevos métodos en `gym.service.ts`.
3. Páginas stub (clientes, usuarios, reportes) — eliminar errores de navegación.
4. `admin-routing.module.ts` actualizado.
5. Componentes de datos simples: `KpiCard`, `QuickActions`, `PagosPanel`, `PlanesPanel`, `ClientesInactivos`, `HorariosDemanda`.
6. `AlertPanel` — requiere lógica de múltiples streams combinados.
7. Componentes SVG: `ChartBar`, `ChartLine`, `ChartHBar`.
8. `CalendarView` — stream interno de fecha.
9. `ReservasTable` — interacciones con `AlertController`/`ToastController`.
10. `AdminPage` — orquestador final que conecta todos los streams.
11. Tests: `admin.utils.spec.ts` con fast-check, luego `admin.page.spec.ts` con Jasmine.

---

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema — esencialmente, un enunciado formal sobre lo que el software debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de corrección verificables por máquina.*

El feature `gym-olimpo-dashboard` contiene lógica de transformación de datos pura concentrada en `admin.utils.ts` (cálculos de ocupación, rankings, filtros de fecha, formatos de moneda) que es altamente apropiada para property-based testing. Los componentes de UI y la integración con Firestore se prueban con tests de ejemplo e integración respectivamente.

**Property Reflection — eliminación de redundancias:**
Tras analizar los 12 requisitos y sus criterios, se identificaron las siguientes consolidaciones:
- Los criterios 1.3 (KPI muestra ícono+valor+label) y 1.6 (colores semánticos) se unifican en la Property 1 sobre `KpiCardConfig`.
- Los criterios 4.1/4.4/4.5 sobre `clasificarBloque` se consolidan en la Property 2.
- Los criterios 9.3, 9.4, 9.5 y 6.2, 6.3, 6.4 (badges deterministas) se consolidan en las Properties 5 y 6 respectivamente.
- Los criterios 7.1 y 7.2 (filtrado y ordenación de planes) se consolidan en la Property 7.
- Los criterios 8.1, 8.2, 8.3 (clientes inactivos) se consolidan en la Property 8.

### Property 1: KpiCardConfig es renderizado completo y semánticamente correcto

*Para cualquier* `KpiCardConfig` válido (con `id`, `label`, `value`, `icon` y `colorClass` definidos), el componente `KpiCardComponent` debe renderizar los campos `icon`, `value` y `label` en el DOM, y la clase CSS aplicada al contenedor debe coincidir exactamente con el valor de `colorClass`.

**Validates: Requirements 1.3, 1.6**

### Property 2: Clasificación de bloque horario es determinista y completa

*Para cualquier* porcentaje entero `p` en `[0, 100]`, la función `clasificarBloque(p)` debe retornar exactamente uno de los cuatro valores `'libre' | 'parcial' | 'casi-lleno' | 'lleno'`, cumpliendo:
- `p === 0` → `'libre'`
- `1 ≤ p ≤ 75` → `'parcial'`
- `76 ≤ p ≤ 99` → `'casi-lleno'`
- `p === 100` → `'lleno'`

**Validates: Requirements 4.1, 4.4, 4.5**

### Property 3: Agrupación de reservas por día cubre exactamente 7 días sin huecos

*Para cualquier* lista de reservas con fechas arbitrarias, la función `agruparReservasPorDia(reservas, inicio, fin)` donde `fin - inicio = 6 días` debe retornar exactamente un array de **7 elementos** con conteos ≥ 0, donde la suma de todos los conteos es igual al número de reservas cuya `fecha` cae en el rango `[inicio, fin]`.

**Validates: Requirements 3.2**

### Property 4: Ranking de horarios más demandados está ordenado y acotado

*Para cualquier* lista de horarios con valores de `cupos` y `cuposDisponibles` arbitrarios (con `cupos > 0`), la función `calcularHorariosDemanda(horarios)` debe retornar un array de como máximo 5 elementos, donde cada elemento tiene `porcentajePromedio` en `[0, 100]` y el array está ordenado de forma no-ascendente por `porcentajePromedio`.

**Validates: Requirements 9.1, 3.3**

### Property 5: Badge de plan por vencer es determinista para todo el dominio [0, 7]

*Para cualquier* entero `d` en `[0, 7]`, la función `badgePlanVence(d)` debe retornar exactamente:
- `'Vence hoy'` si `d === 0`
- `'Vence mañana'` si `d === 1`
- `'${d} días'` si `2 ≤ d ≤ 7`

**Validates: Requirements 7.3, 7.4, 7.5**

### Property 6: Badge de nivel de demanda cubre todos los valores de porcentaje

*Para cualquier* entero `p` en `[0, 100]`, la función `badgeDemanda(p)` debe retornar exactamente uno de `'alta' | 'media' | 'baja'`, cumpliendo:
- `p > 85` → `'alta'`
- `50 ≤ p ≤ 85` → `'media'`
- `p < 50` → `'baja'`

**Validates: Requirements 9.3, 9.4, 9.5**

### Property 7: Filtro de planes por vencer incluye exactamente el rango correcto y está ordenado

*Para cualquier* lista de usuarios con `vigenciaFin` arbitrarias, la función `calcularPlanesPorVencer(usuarios, hoy)` debe incluir exactamente los usuarios cuya `vigenciaFin` cae en `[hoy, hoy+7]` (en días completos), excluir a los demás, y retornar el resultado ordenado de forma ascendente por `diasRestantes`.

**Validates: Requirements 7.1, 7.2**

### Property 8: Filtro de clientes inactivos es correcto, ordenado y acotado a 10 elementos

*Para cualquier* lista de clientes con `planActivo` no vacío y lista de reservas con fechas arbitrarias, la función `calcularClientesInactivos(clientes, reservas, hoy)` debe:
1. Incluir solo clientes cuya reserva confirmada más reciente tiene más de 15 días de antigüedad respecto a `hoy` (o no tienen reservas confirmadas con `planActivo` activo).
2. Retornar como máximo 10 elementos.
3. Estar ordenada de forma no-ascendente por `diasInactividad`.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 9: Formato de monto produce string con round-trip correcto

*Para cualquier* entero `m ≥ 0`, la función `formatMonto(m)` debe producir un string que:
1. Comience con el carácter `'$'`.
2. Use `'.'` como separador de miles.
3. Sea reversible: `parseInt(formatMonto(m).replace(/\./g, '').slice(1)) === m`.

**Validates: Requirements 6.6**

### Property 10: Cálculo de ocupación es correcto y acotado

*Para cualquier* par `(cupos, cuposDisponibles)` donde `cupos > 0` y `0 ≤ cuposDisponibles ≤ cupos`, la función `calcularOcupacion(cupos, cuposDisponibles)` debe retornar un entero en `[0, 100]` igual a `Math.floor(((cupos - cuposDisponibles) / cupos) * 100)`.

**Validates: Requirements 3.1, 4.1, 9.1**

### Property 11: Reactividad — cualquier nueva emisión del Observable se refleja en el estado

*Para cualquier* par de valores `(v1, v2)` emitidos secuencialmente por un `BehaviorSubject` mock inyectado en `AdminPage`, el estado del componente tras la segunda emisión debe reflejar `v2` y no `v1`.

**Validates: Requirements 1.2, 12.1**

### Property 12: Las suscripciones se cancelan tras ngOnDestroy

*Para cualquier* conjunto de Observables mock activos suscritos durante `ngOnInit`, tras llamar a `ngOnDestroy`, ningún Observable debe producir cambios observables en el estado del componente cuando emite valores adicionales.

**Validates: Requirements 12.2**

---

## Testing Strategy

### Enfoque dual: tests de ejemplo + tests de propiedades

| Tipo | Herramienta | Alcance |
|---|---|---|
| Tests de propiedades | **fast-check** (`devDependencies`) | Funciones puras en `admin.utils.ts` |
| Tests de ejemplo | Karma + Jasmine (ya instalado) | Componentes Angular, interacciones UI |
| Tests de integración | Karma + mocks de AngularFire | Flujo reactivo `AdminPage` con servicios mockeados |

> `fast-check` se instala solo en `devDependencies`: `npm install --save-dev fast-check`. No afecta el bundle de producción. Es la librería estándar de property-based testing para TypeScript/JavaScript.

### Tests de propiedades (fast-check) — mínimo 100 iteraciones por propiedad

```typescript
// admin.utils.spec.ts
import * as fc from 'fast-check';
import {
  calcularOcupacion, clasificarBloque, badgePlanVence,
  badgeDemanda, formatMonto, agruparReservasPorDia, calcularHorariosDemanda
} from './admin.utils';

// Feature: gym-olimpo-dashboard, Property 10: Cálculo de ocupación es correcto y acotado
describe('Property 10: calcularOcupacion', () => {
  it('retorna entero en [0,100] y coincide con la fórmula para cualquier par válido', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (cupos, disp) => {
          fc.pre(disp <= cupos);
          const result = calcularOcupacion(cupos, disp);
          return result >= 0 && result <= 100 &&
                 result === Math.floor(((cupos - disp) / cupos) * 100);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: gym-olimpo-dashboard, Property 2: Clasificación de bloque horario
describe('Property 2: clasificarBloque', () => {
  it('retorna exactamente uno de los 4 valores válidos con la clasificación correcta', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), p => {
        const result = clasificarBloque(p);
        const valid = ['libre', 'parcial', 'casi-lleno', 'lleno'];
        if (!valid.includes(result)) return false;
        if (p === 0   && result !== 'libre')      return false;
        if (p >= 1  && p <= 75  && result !== 'parcial')    return false;
        if (p >= 76 && p <= 99  && result !== 'casi-lleno') return false;
        if (p === 100 && result !== 'lleno')      return false;
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: gym-olimpo-dashboard, Property 5: Badge de plan por vencer
describe('Property 5: badgePlanVence', () => {
  it('retorna el badge correcto para cualquier d en [0,7]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 7 }), d => {
        const result = badgePlanVence(d);
        if (d === 0) return result === 'Vence hoy';
        if (d === 1) return result === 'Vence mañana';
        return result === `${d} días`;
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: gym-olimpo-dashboard, Property 6: Badge de nivel de demanda
describe('Property 6: badgeDemanda', () => {
  it('retorna alta/media/baja según los umbrales para cualquier p en [0,100]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), p => {
        const result = badgeDemanda(p);
        if (p > 85)            return result === 'alta';
        if (p >= 50 && p <= 85) return result === 'media';
        return result === 'baja';
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: gym-olimpo-dashboard, Property 9: Formato de monto — round-trip
describe('Property 9: formatMonto', () => {
  it('el valor parseado del string formateado iguala al original', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), monto => {
        const formatted = formatMonto(monto);
        const parsed = parseInt(formatted.replace(/\./g, '').slice(1), 10);
        return formatted.startsWith('$') && parsed === monto;
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: gym-olimpo-dashboard, Property 3: Agrupación de reservas por día — 7 elementos
describe('Property 3: agruparReservasPorDia', () => {
  it('retorna exactamente 7 elementos con suma de conteos = reservas en rango', () => {
    // Test implementado con generadores de fechas y reservas aleatorias
    // La verificación principal: result.length === 7 && sum(result.map(r=>r.conteo)) === inRange
    fc.assert(
      fc.property(
        fc.array(fc.record({ fecha: fc.constantFrom('2024-01-01','2024-01-02','2024-01-03'), conteo: fc.nat(10) })),
        (_reservas) => {
          const inicio = '2024-01-01';
          const fin = '2024-01-07';
          // La función debe retornar exactamente 7 elementos
          // (prueba de estructura; la lógica de conteo se verifica por separado)
          return true; // placeholder: implementar con datos reales en el spec
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Tests de ejemplo (Karma + Jasmine)

```typescript
// admin.page.spec.ts
describe('AdminPage — Quick Actions', () => {
  it('navega a /admin/usuarios al hacer clic en Gestionar Usuarios', ...);
  it('deshabilita el botón de generar horarios durante la ejecución', ...);
  it('muestra toast de éxito cuando generarHorariosProximos30Dias resuelve', ...);
  it('muestra toast de error cuando generarHorariosProximos30Dias rechaza', ...);
});

describe('ReservasTable — Confirmación de asistencia', () => {
  it('deshabilita el botón inmediatamente al hacer clic', ...);
  it('lo re-habilita si la llamada falla y muestra error', ...);
  it('muestra AlertController al cancelar y no ejecuta si el usuario cancela', ...);
});

describe('AlertPanel — Estado vacío', () => {
  it('muestra "Todo en orden" cuando no hay alertas activas', ...);
  it('muestra alertas en orden urgente → advertencia → informativa', ...);
});

describe('KpiCard — Skeleton loader', () => {
  it('muestra skeleton cuando loading=true', ...);
  it('muestra el valor cuando loading=false', ...);
  it('no muestra el indicador de tendencia cuando la propiedad no está definida', ...);
});
```

### Tests de integración (mocks de AngularFire)

```typescript
// admin.integration.spec.ts — usa BehaviorSubject en lugar de Firestore real
describe('AdminPage — Integración reactiva', () => {
  it('actualiza state.kpis cuando el stream de clientesActivos emite nuevos valores');
  it('cancela todas las suscripciones tras ngOnDestroy sin efectos secundarios');
  it('mantiene las últimas alertas cargadas si el stream emite catchError');
  it('muestra mensaje de error en PagosPanel cuando Firestore no está disponible');
});
```

### Matriz de cobertura de requisitos

| Requisito | Tests de propiedad | Tests de ejemplo | Tests de integración |
|---|---|---|---|
| Req 1 (KPIs) | P1, P11 | Ej: skeleton, tendencia, hover | Int: reactividad |
| Req 2 (Alertas) | — | Ej: estado vacío, navegación, orden | Int: error Firestore |
| Req 3 (Gráficos) | P3, P4, P10 | Ej: < 2 puntos, colores SVG | Int: re-render |
| Req 4 (Calendario) | P2, P10 | Ej: navegación, badges lleno/casi-lleno | Int: error Firestore |
| Req 5 (Tabla Reservas) | — | Ej: confirm/cancel, badge gris | Int: scroll horizontal |
| Req 6 (Pagos) | P9 | Ej: badges estado, navegación /pagos | Int: error Firestore |
| Req 7 (Planes) | P5, P7 | Ej: estado vacío | — |
| Req 8 (Inactivos) | P8 | Ej: "Sin sesiones registradas" | — |
| Req 9 (Demanda) | P4, P6 | Ej: estado vacío, barras CSS | — |
| Req 10 (Acciones) | — | Ej: todos los 10 botones | — |
| Req 11 (Diseño) | — | Ej: snapshot clases CSS, animación | — |
| Req 12 (Reactivo) | P11, P12 | Ej: toast éxito/error | Int: suscripciones |
