import * as THREE from 'three';
import gsap from 'gsap';

let time = 0;

export default class BaseCamera extends THREE.PerspectiveCamera {

  constructor() {
    super(50, window.innerWidth / window.innerHeight, 0.5, 1000);

    this._radius = 40;

    this._updatePosition(0);
  }

  _updatePosition(delta) {
    this.position.x = Math.sin(delta) * this._radius;
    this.position.y = 0;
    this.position.z = Math.cos(delta) * this._radius;

    this.lookAt(0, 0, 0);
  }

  _rotateCamera() {
    time += 0.01666666;
    this.position.x = Math.sin(time * 4) * 42;
    this.position.y = -8;
    this.position.z = Math.cos(time * 4) * 42;

    this.lookAt(0, 0, 0);

    if (time < 5.5) {
      requestAnimationFrame(() => this._rotateCamera());
    } else {
      this.position.set(0, 6, 20);
    }
  }

  _startTimeline() {
    const tl = gsap.timeline();

    this.position.set(-6, -30, 10);

    tl

    .to(this.position, {
      y: -6,
      duration: 5,
      ease: "linear",
      onUpdate: () => {
        this.lookAt(-4, -2, 0)
      },
      onComplete: () => {
        this.position.set(-4, -4, 20);
        this.lookAt(-4, -4, 0);
      }
    })

    .to(this.position, {
      z: 40,
      duration: 3,
      ease: "linear",
      onComplete: () => {
        this.position.set(-7, 0, 20),
        this.lookAt(-7, 0, 0)
      }
    })

    .to(this.position, {
      x: -7,
      y: -8,
      duration: 2.5
    })

    .to(this.position, {
      x: -7,
      y: 0,
      duration: 0.5,
      ease: "power1.in",
      onComplete: () => {
        this.position.set(0, -8, 20);
        this.lookAt(0, 0, 0);
        this._rotateCamera();
      }
    })

    .to(this.position, {
      delay: 5.5,
      x: 0,
      y: -30,
      z: 40,
      duration: 4,
      onUpdate: () => {
        this.lookAt(0, 0, 0);
      }
    })

    .to(this.position, {
      x: 4,
      y: -8,
      z: 10,
      duration: 1.5,
      ease: 'power1.in',
      onUpdate: () => {
        this.lookAt(0, 0, 0);
      },
      onComplete: () => {
        this.position.set(0, -8, 20);
        this.lookAt(0, 0, 0);
        time = 0;
        this._rotateCamera();
      }
    })

    .to(this.position, {
      delay: 5.5,
      x: 0,
      y: 0,
      z: 40,
      duration: 3,
      onUpdate: () => {
        this.lookAt(0, 0, 0)
      }
    })
  }

}
