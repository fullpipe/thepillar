import {
  Component,
  ElementRef,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-thepillar',
  imports: [RouterLink],
  templateUrl: './thepillar.html',
  styleUrl: './thepillar.scss',
})
export class Thepillar implements OnInit {
  pillar = viewChild.required<ElementRef<HTMLVideoElement>>('pillar');
  radio = viewChild.required<ElementRef<HTMLAudioElement>>('radio');

  playing = signal(false);
  waiting = signal(false);

  ngOnInit(): void {
    this.pillar().nativeElement.oncanplay = () => {
      console.log('oncanplay');
      // this.pillar().nativeElement.muted = true;
    };

    this.radio().nativeElement.onplaying = () => {
      this.pillar().nativeElement.muted = true;
      this.playing.set(true);
      this.waiting.set(false);
    };
    this.radio().nativeElement.onwaiting = () => {
      this.waiting.set(true);
    };
  }

  play() {
    this.pillar().nativeElement.play();

    this.radio().nativeElement.play();
  }

  pause() {
    // this.pillar().nativeElement.muted = true;
    // this.pillar().nativeElement.set
    // this.radio().nativeElement.play();
    this.radio().nativeElement.pause();
    this.playing.set(false);
    this.waiting.set(false);
  }
}
