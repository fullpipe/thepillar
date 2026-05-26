import { Component, HostListener, input } from '@angular/core';
import { Pillar } from '../../page/thepillar3d/pillar/pillar';
import { heroArrowsPointingOut } from '@ng-icons/heroicons/outline';
import { provideIcons, NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-fullscreen-button',
  imports: [NgIcon],
  templateUrl: './fullscreen-button.html',
  styleUrl: './fullscreen-button.scss',
  viewProviders: [
    provideIcons({
      heroArrowsPointingOut,
    }),
  ],
})
export class FullscreenButton {
  @HostListener('dblclick')
  handleDoubleClick() {
    this.pillar().toggleFullScreen();
  }

  @HostListener('window:keydown.f')
  handleKeydownF() {
    this.pillar().toggleFullScreen();
  }

  pillar = input.required<Pillar>();
}
