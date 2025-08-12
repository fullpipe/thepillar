import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { Pillar } from './pillar/pillar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowsPointingOut,
  heroMicrophone,
  heroPlay,
  heroPlayCircle,
  heroRadio,
  heroSpeakerWave,
  heroSpeakerXMark,
} from '@ng-icons/heroicons/outline';
import { SoundSource } from './pillar/sound';

@Component({
  selector: 'app-thepillar3d',
  imports: [NgIcon],
  templateUrl: './thepillar3d.html',
  styleUrl: './thepillar3d.scss',
  viewProviders: [
    provideIcons({
      heroSpeakerWave,
      heroSpeakerXMark,
      heroRadio,
      heroMicrophone,
      heroArrowsPointingOut,
      heroPlay,
      heroPlayCircle,
    }),
  ],
})
export class Thepillar3d {
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('pillarCanvas');
  pillar!: Pillar;
  loading = signal(true);
  loadProgress = signal(0);
  running = signal(false);
  SoundSource = SoundSource;

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

  async run() {
    this.running.set(true);
    await this.pillar.run();
  }
}
