import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { Pillar } from './pillar/pillar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowPathRoundedSquare,
  heroArrowsPointingOut,
  heroEllipsisHorizontal,
  heroMicrophone,
  heroPlay,
  heroPlayCircle,
  heroRadio,
  heroSpeakerWave,
  heroSpeakerXMark,
} from '@ng-icons/heroicons/outline';
import { Sound } from './pillar/sound';
import { FormsModule } from '@angular/forms';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { InactiveWrap } from '../../component/inactive-wrap/inactive-wrap';
import { Gains } from '../../component/gains/gains';

@Component({
  selector: 'app-thepillar3d',
  imports: [NgIcon, FormsModule, NgxSliderModule, InactiveWrap, Gains],
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
      heroArrowPathRoundedSquare,
      heroEllipsisHorizontal,
    }),
  ],
})
export class Thepillar3d {
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('pillarCanvas');
  pillar!: Pillar;
  sound!: Sound;

  loading = signal(true);
  loadProgress = signal(0);
  prerunning = signal(false);
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

  async run() {
    this.prerunning.set(true);
    await this.pillar.run();

    this.sound = this.pillar.sound;

    this.prerunning.set(false);
    this.running.set(true);
  }

  micGainMultiplier = signal(0.5);

  async resetTech() {
    this.sound.analyser.smoothingTimeConstant = 0.97;
    this.sound.analyser.minDecibels = -75;
    this.sound.analyser.maxDecibels = -10;
    this.sound.minDBCut = 86;
    this.micGainMultiplier.set(0.5);
  }
}
