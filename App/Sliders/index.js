import {
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Group,
  MathUtils,
  Vector3,
  Euler,
  TextureLoader,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import { damp } from 'maath/easing';

import vertex from '../shaders/vertex.glsl';
import fragment from '../shaders/fragment.glsl';

export default class Tiles extends Group {
  constructor() {
    super();

    this._isDragging = false;
    this._width = 450;
    this._radius = 1800;
    this._dragRadiusOffset = 150;
    this._els = [];
    this._sphereCenter = new Vector3(0, 0, 0);
    this._numTiles = 110;

    // For damping rotation
    this._currentRotation = new Euler(0, 0, 0);
    this._targetRotation = new Euler(0, 0, 0);
    this._maxYRotation = MathUtils.degToRad(15);

    // For holding speed and bending
    this._holdingSpeed = { current: 0, prev: 0 };

    this._textureLoader = new TextureLoader();

    this._init();
  }

  _init() {
    const texture = this._textureLoader.load('/matrix.png');
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;

    const planeGeometry = new PlaneGeometry(1, 1, 100, 100);
    const planeMaterial = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        u_time: { value: 0 },
        u_dragSpeed: { value: 0 },
        u_bendFactor: { value: 0 },
        u_sphereCenter: { value: this._sphereCenter },
        uHoldingSpeed: { value: 0 },
        uMap: { value: texture },
        uMainDisplacement: { value: 150.0 }, 
        uNoiseDisplacement: { value: 100.0 }, 
      },
    });

    const lookDirection = new Vector3();
    const normal = new Vector3();

    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = Math.PI * 2 * goldenRatio;

    for (let i = 0; i < this._numTiles; i++) {
      const t = i / this._numTiles;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;

      let radius = this._radius + MathUtils.randFloat(-810, 900);

      const x = radius * Math.sin(inclination) * Math.cos(azimuth);
      const y = radius * Math.sin(inclination) * Math.sin(azimuth);
      const z = radius * Math.cos(inclination);

      const planeMesh = new Mesh(planeGeometry, planeMaterial);
      planeMesh.scale.set(this._width, this._width, 1);
      planeMesh.position.set(x, y, z);

      planeMesh.userData.initialPosition = planeMesh.position.clone();
      planeMesh.userData.dragPosition = planeMesh.position.clone();
      planeMesh.userData.dragPosition.multiplyScalar((radius + this._dragRadiusOffset) / radius);

      normal.subVectors(this._sphereCenter, planeMesh.position).normalize();

      planeMesh.lookAt(planeMesh.position.clone().add(normal));

      this.add(planeMesh);
      this._els.push(planeMesh);
    }
  }

  onDrag(state) {
    this._isDragging = state.dragging;
    const deltaX = state.delta[0] * 0.005;
    const deltaY = state.delta[1] * 0.005;

    this._targetRotation.y -= deltaX;
    this._targetRotation.x = MathUtils.clamp(this._targetRotation.x - deltaY, -this._maxYRotation, this._maxYRotation);
  }

  update(delta) {
    damp(this._currentRotation, 'x', this._targetRotation.x, 0.22, delta);
    damp(this._currentRotation, 'y', this._targetRotation.y, 0.22, delta);

    this.rotation.set(this._currentRotation.x, this._currentRotation.y, this._currentRotation.z);

    const fixedDelta = 0.015;

    damp(this._holdingSpeed, 'current', this._isDragging ? 1 : 0, 0.4, fixedDelta);
    const holdingSpeed = this._holdingSpeed.current - this._holdingSpeed.prev;
    this._holdingSpeed.prev = this._holdingSpeed.current;

    this._els.forEach((el) => {
      const targetPosition = this._isDragging ? el.userData.dragPosition : el.userData.initialPosition;

      damp(el.position, 'x', targetPosition.x, 0.15, delta);
      damp(el.position, 'y', targetPosition.y, 0.15, delta);
      damp(el.position, 'z', targetPosition.z, 0.15, delta);

      el.material.uniforms.u_bendFactor.value = holdingSpeed;
      el.material.uniforms.uHoldingSpeed.value = holdingSpeed;
      el.material.uniforms.u_time.value = performance.now() / 1000;
    });
  }
}