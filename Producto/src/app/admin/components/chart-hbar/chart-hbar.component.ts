import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartBarData } from '../../admin.models';

interface HBar {
  label: string;
  value: number;
  width: number; // % of max
  fill: string;
  y: number;
}

@Component({
  selector: 'app-chart-hbar',
  templateUrl: './chart-hbar.component.html',
  styleUrls: ['./chart-hbar.component.scss']
})
export class ChartHBarComponent implements OnChanges {
  @Input() data: ChartBarData[] = [];
  @Input() title = 'Horarios Más Demandados';

  readonly SVG_W = 400;
  readonly ROW_H = 38;
  readonly PAD_LEFT = 55;

  bars: HBar[] = [];
  svgH = 0;
  hasEnoughData = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.hasEnoughData = this.data.length >= 2;
      if (this.hasEnoughData) {
        this.buildBars(this.data);
      }
    }
  }

  private buildBars(data: ChartBarData[]): void {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    this.svgH = data.length * this.ROW_H + 10;
    const barW = this.SVG_W - this.PAD_LEFT - 40;

    this.bars = data.map((d, i) => ({
      label: d.label,
      value: d.value,
      width: (d.value / maxVal) * barW,
      fill: d.value > 85 ? '#22c55e' : d.value >= 50 ? '#f59e0b' : '#475569',
      y: i * this.ROW_H + 5
    }));
  }
}
