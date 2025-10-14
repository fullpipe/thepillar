import {
  WebGLRenderer,
  PCFSoftShadowMap,
  Scene,
  LoadingManager,
  AmbientLight,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  GridHelper,
  Clock,
  Camera,
  ColorManagement,
  SRGBColorSpace,
  Color,
  BackSide,
  SphereGeometry,
  ShaderMaterial,
} from 'three';

import GUI from 'lil-gui';
import {
  DragControls,
  GLTFLoader,
  OrbitControls,
} from 'three/examples/jsm/Addons.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { LUTCubeLoader } from 'three/addons/loaders/LUTCubeLoader.js';

import { toggleFullScreen } from './helpers/fullscreen';
import Stats from 'stats.js';
import { resizeRendererToDisplaySize } from './helpers/responsiveness';
import { Sound, SoundSource } from './sound';
import { signal } from '@angular/core';

export class Pillar {
  canvas: HTMLElement;
  renderer!: WebGLRenderer;
  composer!: EffectComposer;

  scene!: Scene;
  loadingManager!: LoadingManager;
  ambientLight!: AmbientLight;
  directLight!: DirectionalLight;

  mainWire!: Mesh;
  coreWire!: Mesh;
  pole!: Mesh;

  camera!: Camera;
  cameraControls!: OrbitControls;
  dragControls!: DragControls;

  clock!: Clock;
  stats!: Stats;
  gui!: GUI;

  animations: ((clock: Clock) => void)[] = [];

  mouseProgress = 0.0;
  mouseProgressX = 0.0;
  mouseProgressY = 0.0;
  soundProgress = 0.0;

  sound!: Sound;
  reactOnSound = false;

  config = {
    speed: {
      core: {},
      main: {
        minStart: 0.2,
      },
    },
    light: {
      direct: {
        color: 0xffffff,
        intensity: 0.3,
      },
      ambient: {
        color: 0xffffff,
        intensity: 0.1,
      },
    },
    wire: {
      main: {
        roughness: 0.3,
        metalness: 1.0,
        color: 0xffffff,
      },
      core: {
        roughness: 0.3,
        metalness: 1.0,
        color: 0xffffff,
      },
      pole: {
        roughness: 0.6,
        metalness: 0.0,
        color: 0x616060,
      },
    },
    animation: {
      play: true,
    },
  };

  constructor(canvas: HTMLElement) {
    this.canvas = canvas;
  }

  async init(progress?: (progress: number) => void) {
    ColorManagement.enabled = false;

    const renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.outputColorSpace = SRGBColorSpace;
    this.renderer = renderer;

    this.scene = new Scene();

    await this.buildGUI();
    await this.buildCamera();
    await this.buildPostprocessing();

    const loadingManager = new LoadingManager();
    loadingManager.onStart = () => {};
    loadingManager.onProgress = (_, loaded, total) => {
      if (progress) {
        progress(Math.ceil((100 * loaded) / total));
      }
    };
    loadingManager.onLoad = () => {};
    loadingManager.onError = (e) => {
      throw e;
    };
    this.loadingManager = loadingManager;

    return Promise.all([
      this.buildBG(),
      this.buildLight(),

      // this.buildCoreWireSeparate(),
      // this.buildMainWireSeparate(),

      this.buildCoreWireSeparate2(),
      this.buildMassWireSeparate2(),
      this.buildWrapWireSeparate2(),

      this.buildPole(),
      this.buildGrid(),
      this.buildStatsAndClock(),
      this.buildSound(),
      this.mouseTracking(),
    ]).then(() => this.restoreGUI());
  }

  async buildBG() {
    const geometry = new SphereGeometry(50, 32, 32);
    geometry.computeBoundingBox();

    var material = new ShaderMaterial({
      uniforms: {
        color1: {
          value: new Color('#111111'),
        },
        color2: {
          value: new Color('#000000'),
        },
        bboxMin: {
          value: geometry.boundingBox!.min,
        },
        bboxMax: {
          value: geometry.boundingBox!.max,
        },
      },
      vertexShader: `
        uniform vec3 bboxMin;
        uniform vec3 bboxMax;

        varying vec2 vUv;

        void main() {
          vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;

        varying vec2 vUv;

        void main() {
          gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
        }
      `,
      // wireframe: true,
    });

    // Вариант фона с текстурой
    // const loader = new TextureLoader(this.loadingManager);
    // const texture = loader.load('textures/bambanani_sunset.jpg');
    // texture.colorSpace = SRGBColorSpace;
    // texture.mapping = EquirectangularReflectionMapping;
    // const material = new MeshBasicMaterial({ map: texture });

    material.side = BackSide;
    const sphere = new Mesh(geometry, material);

    console.log(sphere);
    this.scene.add(sphere);

    // this.scene.background = texture;
  }

  async mouseTracking() {
    document.addEventListener('mousemove', (e) => {
      this.mouseProgress = e.clientX / window.innerWidth;

      this.mouseProgressX = e.clientX / window.innerWidth;
      this.mouseProgressY = 1 - e.clientY / window.innerHeight;

      // this.mouseProgressX = Math.abs(e.clientX / window.innerWidth - 0.5) * 2;
      // this.mouseProgressY = Math.abs(e.clientX / window.innerWidth - 0.5) * 2;
      // this.mouseProgressY = Math.abs(e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  async buildSound() {
    this.sound = new Sound();
  }

  async run() {
    await this.sound.init();

    this.reactOnSound = true;
    this.animations.push(() => {
      this.soundProgress = this.sound.progress;
    });

    // document.addEventListener('keydown', (e) => {
    //   if (e.key != ' ') {
    //     return;
    //   }

    //   this.soundSource.set((this.soundSource() + 1) % 3);
    //   this.sound.play(this.soundSource() as SoundSource);
    // });

    // this.sound.play(this.soundSource());
  }

  shutdown = false;
  async destroy() {
    this.shutdown = true;
    this.gui.destroy();
    this.stats.dom.remove();
    this.renderer.dispose();
    this.sound.destroy();
  }

  then = 0;
  draw(now: number) {
    if (this.shutdown) {
      return;
    }

    now *= 0.001;
    const deltaTime = now - this.then;
    this.then = now;

    this.stats.begin();

    if (this.config.animation.play) {
      this.animations.forEach((update) => update(this.clock));
    }

    if (resizeRendererToDisplaySize(this.renderer)) {
      if (this.camera instanceof PerspectiveCamera) {
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();
      }

      if (this.camera instanceof OrthographicCamera) {
        this.camera.left = -this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.right = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();
      }

      this.composer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }

    this.cameraControls.update();

    // this.renderer.render(this.scene, this.camera);
    this.composer.render(deltaTime);

    requestAnimationFrame((t) => this.draw(t));

    this.stats.end();
  }

  async buildPostprocessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const gf = this.gui.addFolder('Postprocessing');

    // {
    //   const DotScreen = new ShaderPass(DotScreenShader);
    //   DotScreen.uniforms['scale'].value = 10;
    //   this.composer.addPass(DotScreen);
    // }

    // {
    //   const luutPass = new LUTPass({
    //     lut: (await this.loadLUT('asd')).texture3D,
    //     intensity: 0.1,
    //   });

    //   luutPass.enabled = false;
    //   this.composer.addPass(luutPass);

    //   const f = gf.addFolder('LUTPass');
    //   f.add(luutPass, 'enabled');
    //   f.add(luutPass.uniforms['intensity'], 'value', 0, 1, 0.0001).name('intensity');
    // }

    {
      const RGBShift = new ShaderPass(RGBShiftShader);
      RGBShift.uniforms['amount'].value = 0.0015;
      RGBShift.enabled = false;
      this.composer.addPass(RGBShift);

      const f = gf.addFolder('RGBShift');
      f.add(RGBShift, 'enabled');
      f.add(RGBShift.uniforms['amount'], 'value', 0, 1, 0.0001).name('amount');
      f.add(RGBShift.uniforms['angle'], 'value', 0, 1, 0.0001).name('angle');
    }

    {
      const filmPass = new FilmPass(
        1, // intensity
        false // grayscale
      );
      filmPass.enabled = false;

      this.composer.addPass(filmPass);
      console.log(filmPass.uniforms);
      const f = gf.addFolder('FilmPass');
      f.add(filmPass, 'enabled');

      f.add((filmPass.uniforms as any)['intensity'], 'value', 0, 3, 0.1).name(
        'intensity'
      );
      f.add((filmPass.uniforms as any)['grayscale'], 'value').name('grayscale');
    }

    {
      const glitchPass = new GlitchPass();
      glitchPass.enabled = false;
      this.composer.addPass(glitchPass);
      const f = gf.addFolder('GlitchPass');
      f.add(glitchPass, 'enabled');
      f.add(glitchPass, 'goWild');
    }

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  async buildGUI() {
    this.gui = new GUI({ title: '🐞 Debug GUI', width: 300 });
    this.gui.onFinishChange(() => {
      const guiState = this.gui.save();
      localStorage.setItem('guiState', JSON.stringify(guiState));
    });

    // reset GUI state button
    const resetGui = () => {
      localStorage.removeItem('guiState');
      this.gui.reset();
    };
    this.gui.add({ resetGui }, 'resetGui').name('RESET');

    const f = this.gui.addFolder('controls');
    f.add(this.config.animation, 'play');

    this.gui.close();
  }

  async restoreGUI() {
    // load GUI state if available in local storage
    const guiState = localStorage.getItem('guiState');
    if (guiState) {
      this.gui.load(JSON.parse(guiState));
    }
  }

  async buildLight() {
    this.directLight = new DirectionalLight(
      this.config.light.direct.color,
      this.config.light.direct.intensity
    );
    this.directLight.position.set(10, 10, 20);
    this.scene.add(this.directLight);
    this.scene.add(this.directLight.target);

    this.ambientLight = new AmbientLight(
      this.config.light.ambient.color,
      this.config.light.ambient.intensity
    );
    this.scene.add(this.ambientLight);

    const folder = this.gui.addFolder('Light');

    const df = folder.addFolder('direct');
    df.add(this.directLight, 'intensity', 0, 1, 0.1);
    df.addColor(this.directLight, 'color');

    const af = folder.addFolder('ambient');
    af.add(this.ambientLight, 'intensity', 0, 1, 0.1);
    af.addColor(this.ambientLight, 'color');
  }

  async buildMainWireSeparate() {
    return Promise.all(
      [...Array(150).keys()].map(async (idx) => {
        const wire = await this.loadGtlfMesh(
          `models/mass-separate-001/mass-001-sm-${String(idx + 1).padStart(
            3,
            '0'
          )}.glb`
        );

        const material = new MeshStandardMaterial({
          roughness: this.config.wire.main.roughness,
          metalness: this.config.wire.main.metalness,
          color: this.config.wire.main.color,
        });
        wire.material = material;

        this.scene.add(wire);
        wire.geometry.setDrawRange(0, 0);

        const randomStart = 0.2 + 0.4 * Math.random();
        const randomDuration = (1 - randomStart) * (0.5 * Math.random());
        const speed = 1 / (1 - randomDuration);

        const progressIdx = this.choooseIdx(idx);

        this.animations.push(() => {
          let progress = this.reactOnSound
            ? this.sound.progressSeparate[progressIdx]
            : this.mouseProgressY;

          // let progress = this.reactOnSound
          //   ? this.soundProgress
          //   : this.mouseProgressY;

          // progress -= randomStart;
          // progress *= speed;
          // progress = Math.max(progress, 0);

          wire.geometry.setDrawRange(
            0,
            Math.floor(wire.geometry.index?.count! * progress)
          );
        });
      })
    );
  }

  choooseIdx(idx: number): number {
    const x = Math.random() * 42;

    if (Math.pow(x, 2) / (42 * 42) > Math.random()) {
      return Math.round(x);
    }

    return this.choooseIdx(idx);
  }

  async buildCoreWireSeparate() {
    return Promise.all(
      [...Array(49).keys()].map(async (idx) => {
        const wire = await this.loadGtlfMesh(
          `models/core-separate-002/core-009-sm-${String(idx + 1).padStart(
            3,
            '0'
          )}.glb`
        );

        const material = new MeshStandardMaterial({
          roughness: this.config.wire.core.roughness,
          metalness: this.config.wire.core.metalness,
          color: this.config.wire.core.color,
        });
        wire.material = material;

        this.scene.add(wire);
        wire.geometry.setDrawRange(0, 0);

        const randomStart = 0.1 * Math.random();
        const randomDuration = (1 - randomStart) * (0.1 * Math.random());
        const speed = 1 / (1 - randomDuration);

        this.animations.push(() => {
          let progress = this.reactOnSound
            ? this.soundProgress
            : this.mouseProgressX;

          progress -= randomStart;
          progress *= speed;
          progress = Math.max(progress, 0);

          wire.geometry.setDrawRange(
            0,
            Math.floor(wire.geometry.index?.count! * progress)
          );
        });
      })
    );
  }

  async buildCoreWireSeparate2() {
    return Promise.all(
      [...Array(13).keys()].map(async (idx) => {
        const wire = await this.loadGtlfMesh(
          `models/core-long-separate-003/core-long_${idx}.glb`
        );

        const material = new MeshStandardMaterial({
          roughness: this.config.wire.core.roughness,
          metalness: this.config.wire.core.metalness,
          color: this.config.wire.core.color,
        });
        wire.material = material;

        this.scene.add(wire);
        wire.geometry.setDrawRange(0, 0);

        const randomStart = 0.1 * Math.random();
        const randomDuration = (1 - randomStart) * (0.1 * Math.random());
        const speed = 1 / (1 - randomDuration);

        this.animations.push(() => {
          let progress = this.reactOnSound
            ? this.soundProgress
            : this.mouseProgressX;

          progress -= randomStart;
          progress *= speed;
          progress = Math.max(progress, 0);

          wire.geometry.setDrawRange(
            0,
            Math.floor(wire.geometry.index?.count! * progress)
          );
        });
      })
    );
  }

  async buildMassWireSeparate2() {
    return Promise.all(
      [...Array(39).keys()].map(async (idx) => {
        const wire = await this.loadGtlfMesh(
          `models/mass-long-separate-003/mass-long_${idx}.glb`
        );

        const material = new MeshStandardMaterial({
          roughness: this.config.wire.core.roughness,
          metalness: this.config.wire.core.metalness,
          color: this.config.wire.core.color,
        });
        wire.material = material;

        this.scene.add(wire);
        wire.geometry.setDrawRange(0, 0);

        const randomStart = 0.1 * Math.random();
        const randomDuration = (1 - randomStart) * (0.1 * Math.random());
        const speed = 1 / (1 - randomDuration);

        const progressIdx = idx;

        this.animations.push(() => {
          let progress = this.reactOnSound
            ? this.sound.progressSeparate[progressIdx]
            : 1 - this.mouseProgressX;

          // let progress = this.reactOnSound
          //   ? this.soundProgress
          //   : this.mouseProgressX;

          // progress -= randomStart;
          // progress *= speed;
          // progress = Math.max(progress, 0);

          wire.geometry.setDrawRange(
            0,
            Math.floor(wire.geometry.index?.count! * progress)
          );
        });
      })
    );
  }

  async buildWrapWireSeparate2() {
    return Promise.all(
      [...Array(104).keys()].map(async (idx) => {
        const wire = await this.loadGtlfMesh(
          `models/wrap-separate-003/wrap_${idx}.glb`
        );

        const material = new MeshStandardMaterial({
          roughness: this.config.wire.main.roughness,
          metalness: this.config.wire.main.metalness,
          color: this.config.wire.main.color,
        });
        wire.material = material;

        this.scene.add(wire);
        wire.geometry.setDrawRange(0, 0);

        const randomStart = 0.2 + 0.4 * Math.random();
        const randomDuration = (1 - randomStart) * (0.5 * Math.random());
        const speed = 1 / (1 - randomDuration);

        const progressIdx = idx % 42;

        this.animations.push(() => {
          let progress = this.reactOnSound
            ? this.sound.progressSeparate[progressIdx]
            : this.mouseProgressY;

          // let progress = this.reactOnSound
          //   ? this.soundProgress
          //   : this.mouseProgressY;

          // progress -= randomStart;
          // progress *= speed;
          // progress = Math.max(progress, 0);

          wire.geometry.setDrawRange(
            0,
            Math.floor(wire.geometry.index?.count! * progress)
          );
        });
      })
    );
  }

  async buildPole() {
    this.pole = await this.loadGtlfMesh('models/thepole-004.gltf');

    const material = new MeshStandardMaterial({
      roughness: this.config.wire.pole.roughness,
      metalness: this.config.wire.pole.metalness,
      color: this.config.wire.pole.color,
    });

    this.pole.material = material;

    this.scene.add(this.pole);

    const f = this.gui.addFolder('Pole');
    f.addColor(this.pole.material as MeshStandardMaterial, 'color');
    f.add(this.pole.material as MeshStandardMaterial, 'roughness', 0, 1, 0.1);
    f.add(this.pole.material as MeshStandardMaterial, 'metalness', 0, 1, 0.1);
  }

  async buildGrid() {
    const gridHelper = new GridHelper(50, 50, 'white', 'white');
    gridHelper.position.y = -2;
    this.scene.add(gridHelper);
  }

  async buildStatsAndClock() {
    this.clock = new Clock();
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  async buildCamera() {
    // const camera = new PerspectiveCamera(50, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 100);
    // camera.position.set(0, 0, 2);
    // camera.lookAt(0, 0, 0);
    // this.camera = camera;

    const left = -this.canvas.clientWidth / this.canvas.clientHeight;
    const right = this.canvas.clientWidth / this.canvas.clientHeight;
    const top = 1;
    const bottom = -1;

    const near = -1;
    const far = 100;
    const ortocamera = new OrthographicCamera(
      left,
      right,
      top,
      bottom,
      near,
      far
    );
    ortocamera.zoom = 1.2;
    this.camera = ortocamera;

    this.camera.position.set(0, 0, 2);
    this.camera.lookAt(0, 0, 0);

    return this.buildControls();
  }

  async buildControls() {
    const cameraControls = new OrbitControls(this.camera, this.canvas);
    cameraControls.enableDamping = true;
    cameraControls.autoRotate = true;
    cameraControls.maxDistance = 2;
    cameraControls.minDistance = 0.1;
    cameraControls.minPolarAngle = Math.PI / 2.5; // минимум вверх 70
    cameraControls.maxPolarAngle = Math.PI / 2 + Math.PI / 9; // максимум вниз (110)
    cameraControls.minZoom = 1.2;
    cameraControls.maxZoom = 5;
    cameraControls.enablePan = false;
    cameraControls.autoRotateSpeed = 0.4;

    if (this.canvas.clientWidth < this.canvas.clientHeight) {
      cameraControls.maxDistance = 3.5;
      cameraControls.minZoom = 1.2;
    }

    // cameraControls.enabled = false
    cameraControls.update();

    document.addEventListener('mousemove', (e) => {
      this.camera.rotateY((e.clientY / window.innerHeight) * Math.PI);
    });

    this.cameraControls = cameraControls;

    const f = this.gui.addFolder('Camera');
    f.add(this.cameraControls, 'autoRotateSpeed', 0, 2, 0.1);
    f.add(this.cameraControls, 'autoRotate');

    // const dragControls = new DragControls([cube], camera, renderer.domElement);
    // dragControls.addEventListener('hoveron', (event) => {
    //   const mesh = event.object as Mesh;
    //   const material = mesh.material as MeshStandardMaterial;
    //   material.emissive.set('green');
    // });
    // dragControls.addEventListener('hoveroff', (event) => {
    //   const mesh = event.object as Mesh;
    //   const material = mesh.material as MeshStandardMaterial;
    //   material.emissive.set('black');
    // });
    // dragControls.addEventListener('dragstart', (event) => {
    //   const mesh = event.object as Mesh;
    //   const material = mesh.material as MeshStandardMaterial;
    //   cameraControls.enabled = false;
    //   animation.play = false;
    //   material.emissive.set('orange');
    //   material.opacity = 0.7;
    //   material.needsUpdate = true;
    // });
    // dragControls.addEventListener('dragend', (event) => {
    //   cameraControls.enabled = true;
    //   animation.play = true;
    //   const mesh = event.object as Mesh;
    //   const material = mesh.material as MeshStandardMaterial;
    //   material.emissive.set('black');
    //   material.opacity = 1;
    //   material.needsUpdate = true;
    // });
    // dragControls.enabled = false;

    // Full screen
    window.addEventListener('dblclick', (event) => {
      if (event.target === this.canvas) {
        toggleFullScreen(this.canvas);
      }
    });
  }

  loadLUT(path: string) {
    const loader = new LUTCubeLoader(this.loadingManager);
    return loader.loadAsync(path);
  }

  loadGtlfMesh(path: string): Promise<Mesh> {
    const loader = new GLTFLoader(this.loadingManager);
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (gltf) => {
          // gltf.scene.traverse(function (child) {
          //   console.log(child.name);
          // });
          // console.log(gltf.scene.getObjectByProperty('class', '001'));
          // console.log(gltf.scene.getObjectByProperty('class', 1));
          // console.log(gltf.scene.getObjectByName('piece01'));
          // console.log(path, gltf);
          // gltf.scene.traverse((child) => {
          //   console.log(path, child);
          // });
          gltf.scene.traverse((child) => {
            if (child instanceof Mesh) {
              resolve(child);
            }
          });

          reject('no Mesh in ' + path);
        },
        () => {},
        (error) => {
          reject(error);
        }
      );
    });
  }

  loadGtlfScene(path: string): Promise<any> {
    const loader = new GLTFLoader(this.loadingManager);
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (gltf) => {
          console.log(gltf.scene);
          resolve(gltf.scene);
        },
        () => {},
        (error) => {
          reject(error);
        }
      );
    });
  }
}
