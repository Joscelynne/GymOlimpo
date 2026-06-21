import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartBarData } from '../../admin.models';

interface BarRect {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  value: number;
  fill: string;
}

@Component({
  selector: 'app-chart-bar',
  templateUrl: './chart-bar.component.html',
  styleUrls: ['./chart-bar.component.scss']
})
export class ChartBarComponent implements OnChanges {
  @Input() data: ChartBarData[] = [];
  @Input() title = 'Ocupación del Día';

  readonly SVG_W = 600;
  readonly SVG_H = 200;
  readonly PADDING_BOTTOM = 30;
  readonly PADDING_TOP = 20;

  bars: BarRect[] = [];
  gridLines = [0, 25, 50, 75, 100];
  hasEnoughData = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.hasEnoughData = this.data.length >= 2;
      if (this.hasEnoughData) {
        this.bars = this.calcBarRects(this.data);
      }
    }
  }

  calcBarRects(data: ChartBarData[]): BarRect[] {
    const n = data.length || 1;
    const usableH = this.SVG_H - this.PADDING_BOTTOM - this.PADDING_TOP;
    const barW = Math.max(Math.floor(this.SVG_W / n) - 6, 4);

    return data.map((d, i) => {
      const height = (d.value / 100) * usableH;
      const y = this.PADDING_TOP + usableH - height;
      return {
        x: i * (this.SVG_W / n) + 3,
        y,
        width: barW,
        height,
        label: d.label,
        value: d.value,
        fill: d.value > 90 ? '#ef4444' : d.value > 70 ? '#f59e0b' : '#22c55e'
      };
    });
  }

  gridY(pct: number): number {
    const usableH = this.SVG_H - this.PADDING_BOTTOM - this.PADDING_TOP;
    return this.PADDING_TOP + usableH - (pct / 100) * usableH;
  }

  labelY(pct: number): number {
    return this.gridY(pct) + 4;
  }
}
