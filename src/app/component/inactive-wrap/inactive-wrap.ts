import { AsyncPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import {
  Subject,
  merge,
  fromEvent,
  map,
  debounceTime,
  of,
  tap,
  distinctUntilChanged,
} from 'rxjs';

@Component({
  selector: 'app-inactive-wrap',
  imports: [AsyncPipe],
  templateUrl: './inactive-wrap.html',
  styleUrl: './inactive-wrap.scss',
})
export class InactiveWrap {
  timeout = input(5000);

  private reset$ = new Subject<boolean>();
  public readonly isActive$ = merge(
    fromEvent(document, 'mousemove').pipe(map(() => true)),
    fromEvent(document, 'touchstart').pipe(map(() => true)),
    this.reset$.pipe(debounceTime(this.timeout())),
    of(true),
  ).pipe(
    tap(() => this.reset$.next(false)),
    distinctUntilChanged(),
  );
}
