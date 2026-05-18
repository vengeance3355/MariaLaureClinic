const root = document.documentElement;
const header = document.querySelector("[data-header]");
const heroScene = document.querySelector("[data-scroll-scene]");
const galleryScene = document.querySelector("[data-scroll-gallery]");
const revealItems = document.querySelectorAll("[data-reveal]");
const treatmentCards = document.querySelectorAll(".treatment-card");
const ritualSteps = document.querySelectorAll(".ritual-stages article");
const teamMembers = document.querySelectorAll(".team-list span");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let sceneProgress = 0;
let threeState = null;

if (!reducedMotion) root.classList.add("can-animate");

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

function proximityToViewport(element, focus = 0.56, strength = 1.35) {
  const rect = element.getBoundingClientRect();
  const center = (rect.top + rect.height / 2) / window.innerHeight;
  return clamp(1 - Math.abs(center - focus) * strength);
}

function updateLinkedMotion() {
  treatmentCards.forEach((card, index) => {
    const active = proximityToViewport(card, 0.56, 1.55);
    const wave = Math.sin(sceneProgress * Math.PI * 2 + index * 0.85) * 4;
    card.style.setProperty("--card-lift", `${(-34 * active + wave).toFixed(2)}px`);
    card.style.setProperty("--card-tilt", `${(4 - active * 7).toFixed(2)}deg`);
  });

  ritualSteps.forEach((step, index) => {
    const active = proximityToViewport(step, 0.6, 1.6);
    step.style.setProperty("--step-lift", `${(-22 * active).toFixed(2)}px`);
    step.style.setProperty("--step-depth", `${(3 - active * 6 + index * 0.35).toFixed(2)}deg`);
  });

  teamMembers.forEach((member, index) => {
    const active = proximityToViewport(member, 0.58, 1.5);
    member.style.setProperty("--member-depth", `${((-8 + active * 13) * (index % 2 ? -1 : 1)).toFixed(2)}deg`);
  });
}

function updateScrollState() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  root.style.setProperty("--scroll", progress.toFixed(4));

  if (header) header.classList.toggle("is-scrolled", window.scrollY > 28);

  if (heroScene) {
    const rect = heroScene.getBoundingClientRect();
    const range = Math.max(1, rect.height - window.innerHeight);
    sceneProgress = clamp(-rect.top / range);
    root.style.setProperty("--scene", sceneProgress.toFixed(4));
  }

  if (galleryScene) {
    const rect = galleryScene.getBoundingClientRect();
    const galleryProgress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
    galleryScene.style.setProperty("--gallery-progress", galleryProgress.toFixed(4));
  }

  updateLinkedMotion();
}

function initReveal() {
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = entry.target.dataset.revealDelay;
        if (delay) entry.target.style.setProperty("--delay", `${delay}ms`);
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
  requestAnimationFrame(() => {
    revealItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
        const delay = item.dataset.revealDelay;
        if (delay) item.style.setProperty("--delay", `${delay}ms`);
        item.classList.add("is-visible");
      }
    });
  });
}

function makeBox(THREE, size, material, position, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return mesh;
}

function initThreeScene() {
  const canvas = document.getElementById("luxury-canvas");
  if (!canvas || !window.THREE) return;

  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.45));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(-0.55, 2.05, 8.2);

  const rig = new THREE.Group();
  scene.add(rig);

  const room = new THREE.Group();
  const services = new THREE.Group();
  rig.add(room, services);

  scene.add(new THREE.AmbientLight(0xf7f1e8, 1.35));

  const keyLight = new THREE.DirectionalLight(0xfff4df, 2.35);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const roseLight = new THREE.PointLight(0x9d3158, 2.8, 11);
  roseLight.position.set(-3.6, 1.3, 2.4);
  scene.add(roseLight);

  const tealLight = new THREE.PointLight(0x2d756c, 2.2, 12);
  tealLight.position.set(3.4, 0.8, 1.8);
  scene.add(tealLight);

  const matFloor = new THREE.MeshStandardMaterial({ color: 0xd8d1c7, metalness: 0.08, roughness: 0.68, transparent: true, opacity: 0.38 });
  const matWall = new THREE.MeshStandardMaterial({ color: 0xfffaf2, metalness: 0.06, roughness: 0.72, transparent: true, opacity: 0.22 });
  const matWhite = new THREE.MeshStandardMaterial({ color: 0xfffbf4, metalness: 0.08, roughness: 0.42 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0xb9956a, metalness: 0.16, roughness: 0.48 });
  const matRose = new THREE.MeshStandardMaterial({ color: 0x9d3158, metalness: 0.32, roughness: 0.36, transparent: true, opacity: 0.84 });
  const matTeal = new THREE.MeshStandardMaterial({ color: 0x2d756c, metalness: 0.34, roughness: 0.32, transparent: true, opacity: 0.84 });
  const matGold = new THREE.MeshStandardMaterial({ color: 0xc7a062, metalness: 0.72, roughness: 0.3 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0xfffaf2, metalness: 0.16, roughness: 0.18, transparent: true, opacity: 0.34, side: THREE.DoubleSide });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 4.4), matFloor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0.45, -1.15, -0.8);
  room.add(floor);

  const wall = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.5), matWall);
  wall.position.set(0.45, 0.6, -2.88);
  room.add(wall);

  const treatmentBed = new THREE.Group();
  treatmentBed.add(makeBox(THREE, [2.65, 0.24, 1.05], matWhite, [0, -0.42, 0]));
  treatmentBed.add(makeBox(THREE, [0.82, 0.18, 0.94], matWhite, [-1.02, -0.2, 0]));
  treatmentBed.add(makeBox(THREE, [1.05, 0.08, 0.18], matGold, [0.52, -0.68, 0.52]));
  treatmentBed.add(makeBox(THREE, [1.05, 0.08, 0.18], matGold, [0.52, -0.68, -0.52]));
  treatmentBed.position.set(-0.55, -0.18, -0.15);
  treatmentBed.rotation.y = -0.18;
  room.add(treatmentBed);

  const device = new THREE.Group();
  device.add(makeBox(THREE, [0.42, 1.05, 0.38], matWhite, [0, -0.3, 0]));
  device.add(makeBox(THREE, [0.48, 0.26, 0.08], matTeal, [0, 0.37, 0.19], [-0.2, 0, 0]));
  device.add(makeBox(THREE, [0.1, 0.34, 0.1], matGold, [0.28, 0.05, 0.13], [0.2, 0.1, -0.2]));
  device.position.set(1.52, -0.18, -0.2);
  room.add(device);

  const consoleTable = new THREE.Group();
  consoleTable.add(makeBox(THREE, [1.58, 0.42, 0.38], matWood, [0, -0.22, 0]));
  consoleTable.add(makeBox(THREE, [0.12, 0.62, 0.12], matGold, [-0.62, -0.72, 0.1]));
  consoleTable.add(makeBox(THREE, [0.12, 0.62, 0.12], matGold, [0.62, -0.72, 0.1]));
  consoleTable.position.set(0.25, -0.12, -1.55);
  room.add(consoleTable);

  const mirrorFrame = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 16, 96), matGold);
  mirrorFrame.scale.set(0.78, 1.22, 0.08);
  mirrorFrame.position.set(0.25, 0.72, -1.52);
  room.add(mirrorFrame);

  const mirrorGlass = new THREE.Mesh(new THREE.CircleGeometry(0.56, 48), matGlass);
  mirrorGlass.scale.set(0.7, 1.1, 1);
  mirrorGlass.position.set(0.25, 0.72, -1.525);
  room.add(mirrorGlass);

  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.35, -1.08, 0.9),
    new THREE.Vector3(-1.3, -1.02, 0.15),
    new THREE.Vector3(0.1, -0.98, -0.35),
    new THREE.Vector3(1.65, -0.98, -0.2),
    new THREE.Vector3(2.35, -0.92, 0.78)
  ]);
  const pathMesh = new THREE.Mesh(new THREE.TubeGeometry(path, 90, 0.012, 8, false), matGold);
  room.add(pathMesh);

  const serviceMaterials = [matRose, matTeal, matGold, matWhite, matRose, matTeal];
  const serviceTiles = [];
  for (let i = 0; i < 6; i += 1) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.78, 0.04), serviceMaterials[i]);
    tile.position.set(-1.65 + i * 0.66, 0.64 + Math.sin(i) * 0.08, -2.05);
    tile.rotation.y = -0.36 + i * 0.14;
    services.add(tile);
    serviceTiles.push(tile);
  }

  const particleCount = 160;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = -2.6 + Math.random() * 5.2;
    positions[i * 3 + 1] = -0.8 + Math.random() * 2.55;
    positions[i * 3 + 2] = -2.25 + Math.random() * 2.8;
  }
  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particlesGeometry,
    new THREE.PointsMaterial({ color: 0xf6e4c0, size: 0.014, transparent: true, opacity: 0.42 })
  );
  room.add(particles);

  threeState = { renderer, scene, camera, rig, room, treatmentBed, device, mirrorFrame, serviceTiles, particles };
  root.classList.add("webgl-ready");
}

function resizeThreeScene() {
  if (!threeState) return;
  const { renderer, camera } = threeState;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.45));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function animateThree(time = 0) {
  if (!threeState) return;
  const t = time * 0.001;
  const eased = smoothstep(sceneProgress);
  const { renderer, scene, camera, rig, room, treatmentBed, device, mirrorFrame, serviceTiles, particles } = threeState;
  const mobile = window.innerWidth < 760;

  rig.position.x = mobile ? 0.72 : 1.15 - eased * 0.75;
  rig.position.y = mobile ? -0.02 : -0.05 + eased * 0.12;
  rig.scale.setScalar(mobile ? 0.72 : 1);
  room.rotation.y = -0.28 + eased * 0.46 + Math.sin(t * 0.25) * 0.018;
  room.rotation.x = -0.06 + eased * 0.09;

  treatmentBed.position.y = -0.18 + Math.sin(t * 0.7) * 0.018;
  device.rotation.y = Math.sin(t * 0.5) * 0.06 + eased * 0.18;
  mirrorFrame.rotation.z = Math.sin(t * 0.35) * 0.018;

  serviceTiles.forEach((tile, index) => {
    const phase = clamp((eased - index * 0.085) * 1.5);
    tile.position.y = 0.62 + phase * 0.38 + Math.sin(t * 0.9 + index) * 0.035;
    tile.position.z = -2.05 + phase * 0.48;
    tile.rotation.y = -0.36 + index * 0.14 + phase * 0.7;
    tile.rotation.x = Math.sin(t * 0.55 + index) * 0.05;
  });

  particles.rotation.y = t * 0.035 + eased * 0.28;
  camera.position.x = mobile ? 0.1 : -0.55 + eased * 0.75;
  camera.position.y = mobile ? 1.35 : 2.05 - eased * 0.55;
  camera.position.z = mobile ? 7.2 : 8.2 - eased * 1.95;
  camera.lookAt(0.25, -0.18, -0.65);

  renderer.render(scene, camera);
  if (!reducedMotion) requestAnimationFrame(animateThree);
}

initReveal();
initThreeScene();
updateScrollState();
resizeThreeScene();
animateThree();

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", () => {
  updateScrollState();
  resizeThreeScene();
});
