# Implementation Tasks: GymOlimpo Dashboard Redesign

## Task 1: Create admin.models.ts and admin.utils.ts
- [x] 1.1 Create `src/app/admin/admin.models.ts` with all TypeScript interfaces
- [x] 1.2 Create `src/app/admin/admin.utils.ts` with all pure transformation functions

## Task 2: Add new methods to GymService
- [x] 2.1 Add `getClientesActivos()`, `getPagosRecientes()`, `getClientesConPlanActivo()`, `getUsuariosConVigencia()`, `getHorariosPorFecha()`, `getReservasPorRango()` to `gym.service.ts`

## Task 3: Create stub sub-pages (clientes, usuarios, reportes)
- [x] 3.1 Create `/admin/clientes` stub page (4 files)
- [x] 3.2 Create `/admin/usuarios` stub page (4 files)
- [x] 3.3 Create `/admin/reportes` stub page (4 files)

## Task 4: Update admin-routing.module.ts
- [x] 4.1 Add lazy-loaded routes for clientes, usuarios, reportes sub-pages

## Task 5: Create KpiCard component
- [x] 5.1 Create `admin/components/kpi-card/kpi-card.component.ts/html/scss`

## Task 6: Create AlertPanel component
- [x] 6.1 Create `admin/components/alert-panel/alert-panel.component.ts/html/scss`

## Task 7: Create SVG Chart components
- [x] 7.1 Create `admin/components/chart-bar/` (vertical bars)
- [x] 7.2 Create `admin/components/chart-line/` (line + area)
- [x] 7.3 Create `admin/components/chart-hbar/` (horizontal bars)

## Task 8: Create CalendarView component
- [x] 8.1 Create `admin/components/calendar-view/calendar-view.component.ts/html/scss`

## Task 9: Create ReservasTable component
- [x] 9.1 Create `admin/components/reservas-table/reservas-table.component.ts/html/scss`

## Task 10: Create PagosPanel, PlanesPanel, ClientesInactivos, HorariosDemanda, QuickActions components
- [x] 10.1 Create `admin/components/pagos-panel/`
- [x] 10.2 Create `admin/components/planes-panel/`
- [x] 10.3 Create `admin/components/clientes-inactivos/`
- [x] 10.4 Create `admin/components/horarios-demanda/`
- [x] 10.5 Create `admin/components/quick-actions/`

## Task 11: Rewrite AdminPage (page.ts, page.html, page.scss, module.ts)
- [x] 11.1 Rewrite `admin.page.ts` with all reactive streams
- [x] 11.2 Rewrite `admin.page.html` with all 10 dashboard sections
- [x] 11.3 Rewrite `admin.page.scss` with responsive grid and dark theme
- [x] 11.4 Update `admin.module.ts` to declare all new components
