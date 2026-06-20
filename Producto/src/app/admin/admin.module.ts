import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AdminPageRoutingModule } from './admin-routing.module';
import { AdminPage } from './admin.page';

// 12 Sub-components
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { AlertPanelComponent } from './components/alert-panel/alert-panel.component';
import { ChartBarComponent } from './components/chart-bar/chart-bar.component';
import { ChartLineComponent } from './components/chart-line/chart-line.component';
import { ChartHBarComponent } from './components/chart-hbar/chart-hbar.component';
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';
import { ReservasTableComponent } from './components/reservas-table/reservas-table.component';
import { PagosPanelComponent } from './components/pagos-panel/pagos-panel.component';
import { PlanesPanelComponent } from './components/planes-panel/planes-panel.component';
import { ClientesInactivosComponent } from './components/clientes-inactivos/clientes-inactivos.component';
import { HorariosDemandaComponent } from './components/horarios-demanda/horarios-demanda.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
    AdminPageRoutingModule
  ],
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
