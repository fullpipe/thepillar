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
  analize = false;

  config = {
    radio: {
      stream: 'https://stream.zeno.fm/u49yw4kjumhtv',
    },
  };

  audioCtx!: AudioContext;
  analyser!: AnalyserNode;
  bufferLength: number;
  dataArray: Uint8Array;

  constructor() {
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.minDecibels = -85;
    this.analyser.maxDecibels = -30;
    this.analyser.fftSize = 256;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

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

  async initMusic() {
    if (this.music) {
      return;
    }

    const idx = Math.ceil(Math.random() * 19);
    const music = new Audio(`/ogg-lofi/${idx}-lo.ogg`);
    this.music = music;
    this.music.crossOrigin = 'anonymous';
    this.music.autoplay = false;
    this.music.preload = 'auto';
    this.music.loop = true;

    const musicSource = this.audioCtx.createMediaElementSource(this.music);
    this.musicSource = musicSource;

    // const canplay = new Promise<void>((resolve, reject) => {
    //   music.addEventListener('canplay', () => {
    //     resolve();
    //   });
    //   music.addEventListener('error', () => {
    //     reject();
    //   });
    // });

    // this.music.load();

    return;
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

  async play(source: SoundSource) {
    this.stopAll();
    switch (source) {
      case SoundSource.Music:
        await this.initMusic();
        this.musicSource.connect(this.analyser);
        this.musicSource.connect(this.audioCtx.destination);
        this.music.play();
        break;
      case SoundSource.Radio:
        await this.initRadio();
        this.radioSource.connect(this.analyser);
        this.radioSource.connect(this.audioCtx.destination);
        this.radio.play();
        break;
      case SoundSource.Mic:
        await this.initMic();
        this.micSource.connect(this.analyser);
        break;
    }

    this.analize = true;
  }

  async init() {
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.minDecibels = -85;
    this.analyser.maxDecibels = -30;
    this.analyser.fftSize = 256;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    await this.initMusic();
    await this.initRadio();

    const update = () => {
      if (!this.analize) {
        requestAnimationFrame(update);
        return;
      }

      this.analyser.getByteFrequencyData(this.dataArray);
      // console.log(dataArray);
      // console.log(dataArray.reduce((a, b) => a + b / 256, 0));

      // const nonZero = dataArray.filter((a) => a > 0);
      // let loudness = 0;
      // if (nonZero.length > 0) {
      //   loudness = nonZero.reduce((a, b) => a + b / 256, 0) / nonZero.length;
      // }

      // const loudness = dataArray.reduce((a, b) => a + b, 0) / bufferLength;

      // @see https://fullpipe.github.io/progress/?graph=KCd4IVsxLDI1NiwxXX5mdW5jcyFbKCdyYXchJygoQSkpICogLS8gey0rIDcoKFMpKTR9J35wYXJhbXMhKCdBITEwNX5MITJ-UyEzMil-bGFiZWwhJ1NpZ21vaWQnKV0pLTd4NCA0LCAoKEwpKX03TWF0aC5wb3d7ATc0LV8
      const x = this.dataArray.reduce((a, b) => a + b, 0) / this.bufferLength;
      const loudness =
        (105 * Math.pow(x, 2)) / (Math.pow(x, 2) + Math.pow(32, 2)) / 100;

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
