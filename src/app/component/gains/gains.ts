import {
  Component,
  effect,
  input,
  signal,
  WritableSignal,
} from '@angular/core';
import { Sound } from '../../page/thepillar3d/pillar/sound';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { NgIcon } from '@ng-icons/core';
import { FullscreenButton } from '../fullscreen-button/fullscreen-button';
import { Pillar } from '../../page/thepillar3d/pillar/pillar';
import { shuffle } from '../../page/thepillar3d/pillar/helpers/shuffle';

@Component({
  selector: 'app-gains',
  imports: [NgxSliderModule, NgIcon, FullscreenButton],
  templateUrl: './gains.html',
  styleUrl: './gains.scss',
})
export class Gains {
  pillar = input.required<Pillar>();
  sound = input.required<Sound>();
  micGainMultiplier = input(0.5);

  gains: WritableSignal<number>[] = [];
  micAvailable = signal(false);
  micOn = signal(false);
  micGain = signal(0);
  radioGain = signal(0);

  constructor() {
    for (let i = 0; i < 29; i++) {
      const gain = signal(0);
      const idx = i;

      this.gains.push(gain);

      effect(() => {
        const g = gain();
        if (!this.sound()) {
          return;
        }

        this.sound().mixer.setGain(idx, g / 100);
      });
    }

    effect(() => {
      const g = this.micGain();
      const multiplier = this.micGainMultiplier();
      if (!this.sound() || !this.sound().mic) {
        return;
      }

      this.sound().mixer.setGain('mic', (g / 100) * multiplier);
    });

    effect(() => {
      const micOn = this.micOn();
      const micAvailable = this.micAvailable();
      const multiplier = this.micGainMultiplier();

      if (!micAvailable) {
        return;
      }

      if (micOn) {
        this.sound().mixer.setGain('mic', multiplier);
      } else {
        this.sound().mixer.setGain('mic', 0);
      }
    });

    effect(() => {
      const g = this.radioGain();
      if (!this.sound()) {
        return;
      }

      this.sound().mixer.setGain('radio', g / 100);
    });
  }

  ngAfterViewInit(): void {
    if (this.sound().mic) {
      this.micAvailable.set(true);
      this.micOn.set(true);
    }

    this.roll();
  }

  async roll() {
    let rolls = 0;
    // if (Math.random() < 0.7) {
    //   this.radioGain.set(Math.random() * 100);
    //   rolls++;
    // }

    this.gains.forEach((gain) => {
      gain.set(0);
    });

    const ids = [...Array(19).keys()];
    shuffle(ids);
    ids.slice(0, 3).forEach((i) => {
      this.gains[i].set(Math.random() * 100);
    });
  }

  async mute() {
    this.radioGain.set(0);
    this.gains.forEach((gain) => {
      gain.set(0);
    });
  }
}
