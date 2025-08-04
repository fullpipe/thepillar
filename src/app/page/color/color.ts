import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-color',
  imports: [],
  templateUrl: './color.html',
  styleUrl: './color.scss',
})
export class Color {
  constructor(private nav: Router) {}

  back() {
    this.nav.navigate(['']);
  }
}
