import * as THREE from 'three';
import { throttle } from 'throttle-debounce';
import Engine from './objects/Engine';
import BaseCamera from './objects/Camera';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import gsap from 'gsap';

// SETUP
let scene = null;
const engine = new Engine();
let camera = null;
let renderScene = null;
let composer = null;
let bloomPass = null;
let mouse = new THREE.Vector2(-1, -1);
let raycaster = new THREE.Raycaster();
let audio = null;

// GEOMETRIES
let columns = [];

// VARIABLES
const MAX_LIMIT = 22;
let alreadyClicked = false;
let delta = 0;
const lights = [];
let time = 0;



function normalize(val, max, min) { return (val - min) / (max - min); }

const startAudio = async () => {
  if (!alreadyClicked) {
    alreadyClicked = true;
    audio = (await import('./objects/Audio')).default;
    camera._startTimeline();

    let swap = false;

    const onBeat = throttle(240, () => {
      swap = !swap;

      if (swap) {
        lights[0].color.r = 0.3;
        lights[0].color.g = 0.8;

        lights[1].color.r = 1;
        lights[1].color.g = 0;
      } else {
        lights[0].color.r = 1;
        lights[0].color.g = 0.3;

        lights[1].color.r = 0.3;
        lights[1].color.g = 1;
      }

      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
    
        for (let j = 0; j < column.length; j++) {
          const cube = column[j];
          const baseScale = {
            x: 0.6,
            y: 0.8
          };

          gsap.to(cube.scale, {
            x: baseScale.x + 0.4,
            y: baseScale.y + 0.4,
            duration: 0.12,
            onComplete: () => {
              gsap.to(cube.scale, {
                x: baseScale.x,
                y: baseScale.y,
                duration: 0.12
              });
            }
          });
        }
      }
    });

    audio.start({
      onBeat: onBeat,
      live: false,
      src: require('url:./song.mp3')
    });
  }
};

const setup = () => {
  scene = new THREE.Scene();
  camera = new BaseCamera();
  composer = new EffectComposer(engine.renderer);
  renderScene = new RenderPass(scene, camera);
  composer.addPass(renderScene);
};

const setupScene = () => {
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.3,
    0.1,
    0.2
  );
  composer.addPass(bloomPass);

  const light1 = new THREE.PointLight(0xffffff, 1, 50);
  light1.position.set(-5, 0, 3);

  const light2 = new THREE.PointLight(0xffffff, 1, 50);
  light2.position.set(0, -2, -5);

  lights.push(light1, light2);
  scene.add(light1, light2);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  ambientLight.position.set(-2, 10, 2);
  scene.add(ambientLight);
}

const createCubeGrid = () => {
  const nbColumns = 6;
  const width = 3;
  const height = 1.4;
  const depth = 0.6;
  const geometry = new THREE.BoxGeometry(width, height, depth);

  for (let i = 0; i < nbColumns; i++) {
    const column = [];

    const max = MAX_LIMIT - 1;
    for (let j = 0; j < MAX_LIMIT; j++) {
      const material = new THREE.MeshPhongMaterial({color: 0xffffff, transparent: true, opacity: 0});
      const cube = new THREE.Mesh(geometry, material);
      const x = i*width + width/2 - (nbColumns/2)*width;
      const y = j*height + height/2 - (max/2)*height;
      const z = 0;

      cube.position.set(x, y, z);
      cube.scale.set(0.6, 0.8, 1);
      scene.add(cube);
      column.push(cube);
    }
    columns.push(column);
  }
};

const animCubes = () => {
  const volumes = audio.values;

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    const volume = volumes[i];
    const portion = Math.floor(column.length * volume);

    for (let j = 0; j < column.length; j++) {
      const cube = column[j];
      cube.material.opacity = j < portion ? 1 : 0;
    }
  }
};

const updateColors = () => {
  const absDelta = Math.abs(time / 10) % 1;

  lights.forEach(light => {
    light.color.r += absDelta
    light.color.b = absDelta
  });
}

const changeCursor = () => {
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects && intersects.length > 0) {
    document.body.classList.add('pointer');
  } else {
    document.body.classList.remove('pointer');
  }
}

const onScroll = (event) => {
  const deltaY = event.deltaY / 600;
  const deltaX = - event.deltaX / 600;

  delta += deltaY + deltaX;
  camera._updatePosition(delta);
}

const onMouseMove = (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  changeCursor();
}

const throttleAnimCubes = throttle(10, () => {
  animCubes();
});

const animate = () => {
  composer.render();
  // engine.renderer.render(scene, camera);

  if (audio && audio.isPlaying) {
    audio.update();
    animCubes();
    updateColors();
  }

  time += 0.01;
  requestAnimationFrame(animate);
};

setup();
setupScene();
createCubeGrid();
animate();

window.addEventListener('wheel', onScroll, false);
window.addEventListener('mousemove', onMouseMove, false);
document.body.addEventListener('click', startAudio, false);
