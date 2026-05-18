const root = document.documentElement;
const header = document.querySelector("[data-header]");
const heroScene = document.querySelector("[data-scroll-scene]");
const galleryScene = document.querySelector("[data-scroll-gallery]");
const revealItems = document.querySelectorAll("[data-reveal]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let sceneProgress = 0;
let threeState = null;

if (!reducedMotion) {
  root.classList.add("can-animate");
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.2, 8.5);

  const rig = new THREE.Group();
  scene.add(rig);

  scene.add(new THREE.AmbientLight(0xf7f1e8, 1.15));

  const keyLight = new THREE.DirectionalLight(0xfff4df, 2.2);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const roseLight = new THREE.PointLight(0x9d3158, 4.4, 18);
  roseLight.position.set(-4, 1.2, 4);
  scene.add(roseLight);

  const tealLight = new THREE.PointLight(0x2d756c, 3.8, 18);
  tealLight.position.set(4, -1, 3);
  scene.add(tealLight);

  const crystalMaterial = new THREE.MeshStandardMaterial({
    color: 0xf7f1e8,
    metalness: 0.26,
    roughness: 0.18,
    transparent: true,
    opacity: 0.88
  });

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 4), crystalMaterial);
  rig.add(core);

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.68, 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.11 })
  );
  rig.add(shell);

  const ringMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xc7a062, metalness: 0.82, roughness: 0.26 }),
    new THREE.MeshStandardMaterial({ color: 0x9d3158, metalness: 0.64, roughness: 0.32 }),
    new THREE.MeshStandardMaterial({ color: 0x2d756c, metalness: 0.7, roughness: 0.28 })
  ];

  const rings = [2.18, 2.72, 3.28].map((radius, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018 + index * 0.006, 18, 180), ringMaterials[index]);
    ring.rotation.x = Math.PI / (2.3 + index * 0.2);
    ring.rotation.y = index * 0.78;
    rig.add(ring);
    return ring;
  });

  const plaques = [];
  const plaqueMaterial = new THREE.MeshStandardMaterial({
    color: 0xfffaf2,
    metalness: 0.18,
    roughness: 0.38,
    transparent: true,
    opacity: 0.54,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.1, 0.035), plaqueMaterial.clone());
    plaque.position.set(Math.cos(angle) * 3.85, Math.sin(angle * 1.7) * 0.75, Math.sin(angle) * 2.25);
    plaque.rotation.y = -angle + Math.PI / 2;
    plaque.rotation.z = Math.sin(angle) * 0.18;
    rig.add(plaque);
    plaques.push(plaque);
  }

  const particleCount = 520;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    const radius = 3.6 + Math.random() * 4.2;
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5.2;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particlesGeometry,
    new THREE.PointsMaterial({
      color: 0xf6e4c0,
      size: 0.018,
      transparent: true,
      opacity: 0.58
    })
  );
  scene.add(particles);

  threeState = { renderer, scene, camera, rig, core, shell, rings, plaques, particles };
  root.classList.add("webgl-ready");
}

function resizeThreeScene() {
  if (!threeState) return;
  const { renderer, camera } = threeState;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function animateThree(time = 0) {
  if (!threeState) return;
  const t = time * 0.001;
  const eased = sceneProgress * sceneProgress * (3 - 2 * sceneProgress);
  const { renderer, scene, camera, rig, core, shell, rings, plaques, particles } = threeState;

  rig.rotation.y = t * 0.16 + eased * 2.35;
  rig.rotation.x = -0.18 + eased * 0.52 + Math.sin(t * 0.4) * 0.025;
  rig.position.x = window.innerWidth < 760 ? 0.65 : 1.2 - eased * 0.9;
  rig.position.y = window.innerWidth < 760 ? -0.15 : -0.05 + eased * 0.18;
  rig.scale.setScalar(window.innerWidth < 760 ? 0.74 : 1);

  core.rotation.x = t * 0.22 + eased * 0.8;
  core.rotation.y = t * 0.31 + eased * 1.1;
  shell.rotation.y = -t * 0.2 + eased * 1.8;

  rings.forEach((ring, index) => {
    ring.rotation.z = t * (0.08 + index * 0.03) + eased * (index + 1) * 0.5;
    ring.rotation.y += 0.0015 * (index + 1);
  });

  plaques.forEach((plaque, index) => {
    plaque.rotation.x = Math.sin(t * 0.55 + index) * 0.08 + eased * 0.16;
    plaque.material.opacity = 0.34 + Math.sin(t + index) * 0.06 + eased * 0.14;
  });

  particles.rotation.y = -t * 0.035 + eased * 0.35;
  camera.position.z = 8.5 - eased * 2.2;
  camera.position.y = 0.2 + eased * 0.42;
  camera.lookAt(0.25, 0, 0);

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
