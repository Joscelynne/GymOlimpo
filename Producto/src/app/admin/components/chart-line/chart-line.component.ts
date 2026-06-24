import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartLineData } from '../../admin.models';

interface LinePoint {
  x: number;
  y: number;
  conteo: number;
  fecha: string;
}

@Component({
  selector: 'app-chart-line',
  templateUrl: './chart-line.component.html',
  styleUrls: ['./chart-line.component.scss']
})
export class ChartLineComponent implements OnChanges {
  @Input() data: ChartLineData[] = [];
  @Input() title = 'Reservas (últimos 7 días)';

  readonly SVG_W = 560;
  readonly SVG_H = 160;
  readonly PAD = 20;

  points: LinePoint[] = [];
  linePath = '';
  areaPath = '';
  hasEnoughData = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.hasEnoughData = this.data.length >= 2;
      if (this.hasEnoughData) {
        this.buildPaths(this.data);
      }
    }
  }

  private buildPaths(data: ChartLineData[]): void {
    const maxVal = Math.max(...data.map(d => d.conteo), 1);
    const step = (this.SVG_W - this.PAD * 2) / Math.max(data.length - 1, 1);

    this.points = data.map((d, i) => {
      const x = this.PAD + i * step;
      const y = this.PAD + (this.SVG_H - this.PAD) - (d.conteo / maxVal) * (this.SVG_H - this.PAD * 2);
      return { x, y, conteo: d.conteo, fecha: d.fecha };
    });

    this.linePath = this.points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');

    const first = this.points[0];
    const last = this.points[this.points.length - 1];
    const baseY = this.PAD + (this.SVG_H - this.PAD);
    this.areaPath = `${this.linePath} L${last.x.toFixed(1)},${baseY} L${first.x.toFixed(1)},${baseY} Z`;
  }
}
