import { shuffle } from './helpers/shuffle';

export enum SoundSource {
  Music,
  Radio,
  Mic,
}

export class Sound {
  radio!: HTMLMediaElement;
  radioSource!: MediaElementAudioSourceNode;

  music!: HTMLMediaElement;
  musicSource!: MediaElementAudioSourceNode;

  mic!: MediaStream;
  micSource!: MediaStreamAudioSourceNode;

  progress = 0;
  progressSeparate!: Float32Array<ArrayBuffer>;
  analize = false;

  mixer!: Mixer;

  config = {
    radio: {
      stream: 'https://stream.zeno.fm/u49yw4kjumhtv',
    },
  };

  audioCtx!: AudioContext;
  analyser!: AnalyserNode;
  bufferLength!: number;
  dataArray!: Uint8Array<ArrayBuffer>;

  constructor() {}

  async initMic() {
    if (this.mic) {
      return;
    }

    this.mic = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    const micSource = this.audioCtx.createMediaStreamSource(this.mic);
    this.micSource = micSource;
  }

  async initRadio() {
    if (this.radio) {
      return;
    }

    this.radio = new Audio(this.config.radio.stream);
    this.radio.crossOrigin = 'anonymous';
    this.radio.autoplay = false;
    this.radio.preload = 'none';

    const radioSource = this.audioCtx.createMediaElementSource(this.radio);
    this.radioSource = radioSource;
    this.radio.onerror = (e) => {
      console.error('radio.onerror', e);
    };
  }

  stopAll() {
    if (this.radioSource) {
      this.radio.pause();
      this.radioSource.disconnect();
    }
    if (this.musicSource) {
      this.music.pause();
      this.musicSource.disconnect();
    }
    if (this.micSource) {
      this.micSource.disconnect();
    }
  }

  async loadTrack(path: string): Promise<Track> {
    const track = new Audio();
    track.crossOrigin = 'anonymous';
    track.autoplay = false;
    track.preload = 'auto';
    track.loop = true;

    const canplaythrough = new Promise<Track>((resolve, reject) => {
      track.addEventListener(
        'canplaythrough',
        () =>
          resolve({
            name: path,
            audio: track,
          }),
        false
      );
    });

    track.src = path;
    track.load();

    return canplaythrough;
  }

  tracks: Track[] = [];
  minDBCut = 86;

  async init() {
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.97;
    this.analyser.minDecibels = -75;
    this.analyser.maxDecibels = -10;

    this.analyser.fftSize = 256;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.progressSeparate = new Float32Array(this.bufferLength);

    const mixer = new Mixer(this.audioCtx);
    this.mixer = mixer;

    const ids = [...Array(19).keys()].map((i) => i + 1);
    shuffle(ids);
    this.tracks = await Promise.all(
      ids.map((idx) => {
        return this.loadTrack(`/ogg-lofi/${idx}-lo.ogg`);
      })
    );

    this.tracks.push(await this.loadTrack('/test-mp3/10hz.mp3'));
    this.tracks.push(await this.loadTrack('/test-mp3/50hz.mp3'));
    this.tracks.push(await this.loadTrack('/test-mp3/50to5000hz-linScale.mp3'));
    this.tracks.push(await this.loadTrack('/test-mp3/50to5000hz-logScale.mp3'));
    this.tracks.push(await this.loadTrack('/test-mp3/100hz.mp3'));
    this.tracks.push(await this.loadTrack('/test-mp3/500hz.mp3'));
    this.tracks.push(await this.loadTrack('/test-mp3/1000hz.mp3'));
    this.tracks.push(await this.loadTrack('/test-mp3/brown-10dB.mp3'));
    this.tracks.push(await this.loadTrack('/test-mp3/pink-10dB.mp3'));
    this.tracks.push(await this.loadTrack('/test-mp3/whiteGauss-10dB.mp3'));

    this.tracks.forEach((track, i) => {
      const source = this.audioCtx.createMediaElementSource(track.audio);
      mixer.add(i, source);

      track.audio.play();
    });

    await this.initRadio();
    this.radio.play();
    mixer.add('radio', this.radioSource);

    try {
      await this.initMic();
      mixer.add('mic', this.micSource, true);
    } catch (error) {}

    mixer.connectAnalizer(this.analyser);
    mixer.connect(this.audioCtx.destination);

    this.analize = true;

    const update = () => {
      if (!this.analize) {
        requestAnimationFrame(update);
        return;
      }

      this.analyser.getByteFrequencyData(this.dataArray);
      this.analyser.getFloatFrequencyData(this.progressSeparate);

      // for (let i = 0; i < this.dataArray.length; i++) {
      //   this.progressSeparate[i] = progressCalc(this.dataArray[i]);
      // }

      for (let i = 0; i < this.progressSeparate.length; i++) {
        this.progressSeparate[i] = this.progressSeparate[i] + this.minDBCut;
        if (this.progressSeparate[i] < 0) {
          this.progressSeparate[i] = 0;
        }
        this.progressSeparate[i] = this.progressSeparate[i] / this.minDBCut;
      }
      // console.log(this.progressSeparate);

      // const nonZero = dataArray.filter((a) => a > 0);
      // let loudness = 0;
      // if (nonZero.length > 0) {
      //   loudness = nonZero.reduce((a, b) => a + b / 256, 0) / nonZero.length;
      // }

      // const loudness = dataArray.reduce((a, b) => a + b, 0) / bufferLength;

      const x = this.dataArray.reduce((a, b) => a + b, 0) / this.bufferLength;
      const loudness = progressCalc(x);

      this.progress = loudness;

      requestAnimationFrame(update);
    };

    update();
  }

  destroy() {
    this.radioSource.disconnect();
    this.radio.pause();

    this.micSource.disconnect();
    this.mic.getTracks().forEach((t) => t.stop());

    this.musicSource.disconnect();
    this.music.pause();
  }
}

class Mixer {
  inputs: { [key: string | number]: GainNode } = {};

  output: AudioNode;
  analizerOutput: AudioNode;

  constructor(private ctx: AudioContext) {
    this.output = this.ctx.createGain();
    this.analizerOutput = this.ctx.createGain();
  }

  setGain(name: string | number, gain: number) {
    if (!this.inputs[name]) {
      return;
    }

    this.inputs[name].gain.setTargetAtTime(gain, this.ctx.currentTime, 0.01);
  }

  add(name: string | number, source: AudioNode, silent?: boolean) {
    const gain = this.ctx.createGain();

    source.connect(gain);

    this.inputs[name] = gain;

    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    if (!silent) {
      gain.connect(this.output);
    }
    gain.connect(this.analizerOutput);
  }

  connect(destination: AudioNode) {
    this.output.connect(destination);
  }

  connectAnalizer(destination: AnalyserNode) {
    this.analizerOutput.connect(destination);
  }
}

function progressCalc(x: number): number {
  // @see https://fullpipe.github.io/progress/?graph=KCd4IVsxLDI1NiwxXX5mdW5jcyFbKCdyYXchJygoQSkpICogLS8gey0rIDcoKFMpKTR9J35wYXJhbXMhKCdBITEwNX5MITJ-UyEzMil-bGFiZWwhJ1NpZ21vaWQnKV0pLTd4NCA0LCAoKEwpKX03TWF0aC5wb3d7ATc0LV8
  let y = (105 * Math.pow(x, 2)) / (Math.pow(x, 2) + Math.pow(32, 2)) / 100;
  // return Math.round(y * 100) / 100;
  return y;
}

type Track = {
  name: string;
  audio: HTMLAudioElement;
};
