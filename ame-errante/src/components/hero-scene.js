import * as THREE from "three";
export async function createHeroScene(hero, signal) {
  const canvas = hero.querySelector(".hero-canvas");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = matchMedia("(pointer: coarse)");
  if (reduced.matches) {
    hero.dataset.effectState = "reduced";
    return;
  }
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!context) {
    hero.dataset.effectState = "fallback";
    return;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
  camera.position.z = 5;
  let texture;
  try {
    texture = await new THREE.TextureLoader().loadAsync(
      "/assets/companions.webp",
    );
  } catch (error) {
    throw error;
  }
  if (signal.aborted) {
    texture.dispose();
    return;
  }
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: false,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse.matches ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  texture.colorSpace = THREE.SRGBColorSpace;
  const imageGeometry = new THREE.PlaneGeometry(1, 1);
  const imageMaterial = new THREE.MeshBasicMaterial({
    map: texture,
  });
  const imagePlane = new THREE.Mesh(imageGeometry, imageMaterial);
  scene.add(imagePlane);
  const count = coarse.matches ? 20 : 64;
  const positions = new Float32Array(count * 3);
  const origins = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const speeds = new Float32Array(count);
  let seed = 271828;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    origins[i * 3] = (random() - 0.5) * 12;
    origins[i * 3 + 1] = (random() - 0.5) * 5.5;
    origins[i * 3 + 2] = 0.2 + random() * 2;
    sizes[i] = 3 + random() * 7;
    speeds[i] = 0.025 + random() * 0.035;
  }
  positions.set(origins);
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const particleMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aSize;
      void main(){vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=clamp(aSize*(5.0/-p.z),2.0,18.0);}`,
    fragmentShader: `void main(){float d=length(gl_PointCoord-vec2(0.5));float alpha=exp(-d*d*18.0)*0.25;gl_FragColor=vec4(1.0,0.82,0.43,alpha);}`,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.frustumCulled = false;
  scene.add(particles);
  let visible = false,
    disposed = false,
    lost = false;
  let frameId = 0,
    lastRender = 0,
    lastTick = 0,
    phase = 0,
    frames = 0;
  const target = new THREE.Vector2(),
    current = new THREE.Vector2();
  const canRun = () =>
    visible && !document.hidden && !reduced.matches && !lost && !disposed;
  const updateState = () => {
    hero.dataset.effectState = lost
      ? "fallback"
      : reduced.matches
        ? "reduced"
        : !visible || document.hidden
          ? "suspended"
          : "running";
  };
  function draw(timestamp = 0) {
    const delta = lastTick ? Math.min((timestamp - lastTick) / 1000, 0.05) : 0;
    lastTick = timestamp;
    if (canRun()) phase += delta;
    current.lerp(target, 0.06);
    if (reduced.matches || coarse.matches) current.multiplyScalar(0.85);
    imagePlane.rotation.y = current.x * 0.012;
    imagePlane.rotation.x = current.y * 0.008;
    camera.position.x = current.x * 0.025;
    camera.position.y = current.y * 0.015;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = origins[i * 3] + Math.sin(phase * 0.17 + i) * 0.08;
      positions[i * 3 + 1] =
        ((origins[i * 3 + 1] + phase * speeds[i] + 2.75) % 5.5) - 2.75;
    }
    particleGeometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    hero.dataset.effectFrames = String(++frames);
  }
  function frame(timestamp) {
    frameId = 0;
    if (!canRun()) return;
    if (timestamp - lastRender >= 1000 / 30) {
      draw(timestamp);
      lastRender = timestamp;
    }
    frameId = requestAnimationFrame(frame);
  }
  function synchronize() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastTick = 0;
    updateState();
    if (canRun()) frameId = requestAnimationFrame(frame);
  }
  function resize() {
    if (lost || disposed) return;
    const width = hero.clientWidth,
      height = hero.clientHeight + 32;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(22.5)) * 5;
    const viewWidth = viewHeight * camera.aspect;
    const imageAspect = 1672 / 941;
    const planeHeight = Math.max(viewHeight, viewWidth / imageAspect) * 1.035;
    const planeWidth = planeHeight * imageAspect;
    imagePlane.scale.set(planeWidth, planeHeight, 1);
    const position = width <= 600 ? 0.65 : width <= 1050 ? 0.57 : 0.5;
    imagePlane.position.x = (viewWidth - planeWidth) * (position - 0.5);
    draw();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hero);
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      synchronize();
    },
    {
      threshold: 0.05,
    },
  );
  observer.observe(hero);
  const onPointer = (event) => {
    if (coarse.matches || reduced.matches) return;
    const rect = hero.getBoundingClientRect();
    target.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
  };
  const resetPointer = () => target.set(0, 0);
  const onReduced = () => {
    target.set(0, 0);
    synchronize();
    if (!lost) draw();
  };
  const onLost = (event) => {
    event.preventDefault();
    lost = true;
    canvas.hidden = true;
    synchronize();
  };
  hero.addEventListener("pointermove", onPointer, {
    passive: true,
  });
  hero.addEventListener("pointerleave", resetPointer);
  document.addEventListener("visibilitychange", synchronize);
  reduced.addEventListener("change", onReduced);
  canvas.addEventListener("webglcontextlost", onLost);
  resize();
  hero.dataset.threeVersion = THREE.REVISION;
  const onShow = (event) => {
    if (!event.persisted || disposed) return;
    const rect = hero.getBoundingClientRect();
    visible = rect.bottom > 0 && rect.top < innerHeight;
    synchronize();
  };
  window.addEventListener("pageshow", onShow);
  const onHide = (event) => {
    if (event.persisted) {
      visible = false;
      synchronize();
      return;
    }
    dispose();
  };
  window.addEventListener("pagehide", onHide);
  function dispose() {
    if (disposed) return;
    disposed = true;
    hero.dataset.effectState = "disposed";
    if (frameId) cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    observer.disconnect();
    hero.removeEventListener("pointermove", onPointer);
    hero.removeEventListener("pointerleave", resetPointer);
    document.removeEventListener("visibilitychange", synchronize);
    reduced.removeEventListener("change", onReduced);
    canvas.removeEventListener("webglcontextlost", onLost);
    window.removeEventListener("pageshow", onShow);
    window.removeEventListener("pagehide", onHide);
    imageGeometry.dispose();
    imageMaterial.dispose();
    texture.dispose();
    particleGeometry.dispose();
    particleMaterial.dispose();
    renderer.dispose();
  }
  return dispose;
}
