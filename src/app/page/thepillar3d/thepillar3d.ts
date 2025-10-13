import {
  Component,
  effect,
  ElementRef,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
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
import {
  debounceTime,
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  of,
  Subject,
  tap,
} from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { NgxSliderModule } from '@angular-slider/ngx-slider';

const MicGainMultiplier = 1.5;

@Component({
  selector: 'app-thepillar3d',
  imports: [NgIcon, FormsModule, AsyncPipe, NgxSliderModule],
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

  private reset$ = new Subject<boolean>();
  public readonly isActive$ = merge(
    fromEvent(document, 'mousemove').pipe(map(() => true)),
    fromEvent(document, 'touchstart').pipe(map(() => true)),
    this.reset$.pipe(debounceTime(5000)),
    of(true)
  ).pipe(
    tap(() => this.reset$.next(false)),
    distinctUntilChanged()
  );

  gains: WritableSignal<number>[] = [];
  micAvailable = signal(false);
  micOn = signal(false);
  micGain = signal(0);
  radioGain = signal(0);

  constructor() {
    for (let i = 0; i < 20; i++) {
      const gain = signal(0);
      const idx = i;

      this.gains.push(gain);

      effect(() => {
        const g = gain();
        if (!this.sound) {
          return;
        }

        this.sound.mixer.setGain(idx, g / 100);
      });
    }

    effect(() => {
      const g = this.micGain();
      if (!this.sound || !this.sound.mic) {
        return;
      }

      this.sound.mixer.setGain('mic', (g / 100) * MicGainMultiplier);
    });

    effect(() => {
      const micOn = this.micOn();
      const micAvailable = this.micAvailable();

      if (!micAvailable) {
        return;
      }

      console.log(micOn, micAvailable);

      if (micOn) {
        this.sound.mixer.setGain('mic', MicGainMultiplier);
      } else {
        this.sound.mixer.setGain('mic', 0);
      }
    });

    effect(() => {
      const g = this.radioGain();
      if (!this.sound) {
        return;
      }

      this.sound.mixer.setGain('radio', g / 100);
    });
  }

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

    this.roll();

    this.prerunning.set(false);
    this.running.set(true);

    if (this.sound.mic) {
      this.micAvailable.set(true);
      this.micOn.set(true);
    }
  }

  async roll() {
    let rolls = 0;
    // if (Math.random() < 0.7) {
    //   this.radioGain.set(Math.random() * 100);
    //   rolls++;
    // }

    this.gains.forEach((gain) => {
      if (Math.random() < 0.7) {
        gain.set(0);
        return;
      }

      rolls++;
      gain.set(Math.random() * 100);
    });

    if (rolls == 0) {
      this.roll();
    }
  }

  async mute() {
    this.radioGain.set(0);
    this.gains.forEach((gain) => {
      gain.set(0);
    });
  }
}
