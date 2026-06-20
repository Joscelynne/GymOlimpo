import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ClientePlanVence } from '../../admin.models';
import { badgePlanVence } from '../../admin.utils';

@Component({
  selector: 'app-planes-panel',
  templateUrl: './planes-panel.component.html',
  styleUrls: ['./planes-panel.component.scss']
})
export class PlanesPanelComponent {
  @Input() clientes: ClientePlanVence[] = [];
  @Input() error: string | null = null;
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }

  getBadgeText(dias: number): string {
    return badgePlanVence(dias);
  }

  badgeClass(dias: number): string {
    if (dias <= 1) {
      return 'badge-red';
    }
    return 'badge-orange';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    } catch {
      return dateStr;
    }
  }

  trackById(_: number, item: ClientePlanVence): string {
    return item.uid;
  }
}
