import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss']
})
export class QuickActionsComponent {
  @Input() generatingHorarios = false;
  @Output() generarHorarios = new EventEmitter<void>();

  onGenerar(): void {
    if (this.generatingHorarios) return;
    this.generarHorarios.emit();
  }
}
