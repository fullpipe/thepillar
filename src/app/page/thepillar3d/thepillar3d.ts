import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { Pillar } from './pillar/pillar';

@Component({
  selector: 'app-thepillar3d',
  imports: [],
  templateUrl: './thepillar3d.html',
  styleUrl: './thepillar3d.scss',
})
export class Thepillar3d {
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('pillarCanvas');
  pillar!: Pillar;
  loading = signal(true);
  loadProgress = signal(0);
  running = signal(false);

  constructor() {}

  async ngOnInit() {
    this.pillar = new Pillar(this.canvas().nativeElement);
    await this.pillar.init((p) => this.loadProgress.set(p));
    this.loading.set(false);
    this.pillar.draw(0);
  }

  ngOnDestroy(): void {
    this.pillar.destroy();
  }

  run() {
    this.pillar.run();
    this.running.set(true);
  }
}
