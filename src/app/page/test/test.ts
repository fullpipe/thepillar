import { Component, ElementRef, viewChild } from '@angular/core';

import { MediaRecorder, register } from 'extendable-media-recorder';
import { connect } from 'extendable-media-recorder-wav-encoder';

await register(await connect());

@Component({
  selector: 'app-test',
  imports: [],
  templateUrl: './test.html',
  styleUrl: './test.scss',
})
export class Test {
  audioCtx!: AudioContext;
  mic!: MediaStream;
  micSource!: MediaStreamAudioSourceNode;

  radio = viewChild.required<ElementRef<HTMLAudioElement>>('radio');

  async start() {
    if (this.mic) {
      return;
    }

    this.audioCtx = new AudioContext();

    this.mic = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
      },
      video: false,
    });

    const mediaRecorder = new MediaRecorder(this.mic, {
      mimeType: 'audio/wav',
    });

    // const ws = new WebSocket('http://localhost:8085/ws');
    const ws = new WebSocket('https://thepillar-radio.fullpipe.dev/ws');
    ws.onopen = function (evt) {
      console.log('OPEN');
      mediaRecorder.start(100);
    };

    ws.onclose = function (evt) {
      console.log('CLOSE');
    };

    ws.onmessage = function (evt) {
      console.log('RESPONSE: ' + evt.data);
    };

    ws.onerror = function (evt) {
      console.log('ERROR: ' + evt);
    };

    mediaRecorder.addEventListener('dataavailable', (d) => {
      console.log('dataavailable');
      ws.send(d.data);
    });
  }

  startRadio() {
    this.radio().nativeElement.play();
  }
}
