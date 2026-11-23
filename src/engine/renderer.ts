import * as THREE from 'three';

export interface InsetView {
  camera: THREE.PerspectiveCamera;
  /** CSS pixels relative to the canvas. */
  rect: { x: number; y: number; w: number; h: number };
}

/**
 * Thin wrapper over WebGLRenderer tuned for iPhone: DPR capped at 2 (1.5 in
 * low-power mode), no shadow maps, fog for cheap distance culling, and an
 * optional inset view (used for mirror checks) via scissor.
 */
export class Renderer {
  readonly gl: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(62, 1, 0.1, 420);
  private width = 1;
  private height = 1;

  constructor(
    readonly canvas: HTMLCanvasElement,
    lowPower = false
  ) {
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
    this.gl = new THREE.WebGLRenderer({
      canvas,
      antialias: dpr < 2,
      powerPreference: 'high-performance',
      stencil: false,
      preserveDrawingBuffer: false
    });
    this.gl.setPixelRatio(dpr);
    this.gl.outputColorSpace = THREE.SRGBColorSpace;
    this.gl.shadowMap.enabled = false;
    this.resize();
  }

  resize(): void {
    const r = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, r.width);
    this.height = Math.max(1, r.height);
    this.gl.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render(inset?: InsetView | null): void {
    const gl = this.gl;
    gl.setScissorTest(false);
    gl.setViewport(0, 0, this.width, this.height);
    gl.render(this.scene, this.camera);
    if (inset) {
      const { x, y, w, h } = inset.rect;
      const yy = this.height - y - h; // WebGL origin is bottom-left
      inset.camera.aspect = w / h;
      inset.camera.updateProjectionMatrix();
      gl.setScissorTest(true);
      gl.setScissor(x, yy, w, h);
      gl.setViewport(x, yy, w, h);
      gl.render(this.scene, inset.camera);
      gl.setScissorTest(false);
      gl.setViewport(0, 0, this.width, this.height);
    }
  }

  get size(): { w: number; h: number } {
    return { w: this.width, h: this.height };
  }

  dispose(): void {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
    this.gl.dispose();
  }
}
