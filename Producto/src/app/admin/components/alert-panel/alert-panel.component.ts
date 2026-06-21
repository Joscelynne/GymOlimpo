import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AlertaAdmin } from '../../admin.models';

@Component({
  selector: 'app-alert-panel',
  templateUrl: './alert-panel.component.html',
  styleUrls: ['./alert-panel.component.scss']
})
export class AlertPanelComponent {
  @Input() alertas: AlertaAdmin[] = [];
  @Input() error: string | null = null;

  constructor(private router: Router) {}

  navigate(ruta: string): void {
    this.router.navigate([ruta]);
  }

  get hasAlertas(): boolean {
    return this.alertas.length > 0;
  }

  trackById(_: number, alerta: AlertaAdmin): string {
    return alerta.id;
  }
}
