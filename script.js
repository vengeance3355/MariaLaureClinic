const root = document.documentElement;
const header = document.querySelector("[data-header]");
const loader = document.querySelector("[data-loader]");
const chapters = Array.from(document.querySelectorAll("[data-chapter]"));
const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
const navItems = Array.from(document.querySelectorAll("[data-nav]"));
const serviceNodes = Array.from(document.querySelectorAll(".service-node"));
const ritualItems = Array.from(document.querySelectorAll(".ritual-sequence article"));
const galleryItems = Array.from(document.querySelectorAll(".gallery-strip figure"));
const signalItems = Array.from(document.querySelectorAll(".signal-grid article"));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  targetProgress: 0,
  progress: 0,
  activeStage: 0,
  mouseX: 0,
  mouseY: 0,
  width: window.innerWidth,
  height: window.innerHeight
};

let threeState = null;
let scrollTicking = false;
let loaderClosed = false;

if (!reducedMotion) root.classList.add("can-animate");

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(value) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

function mixArray(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function proximityToViewport(element, focus = 0.58, strength = 1.55) {
  const rect = element.getBoundingClientRect();
  const center = (rect.top + rect.height / 2) / window.innerHeight;
  return clamp(1 - Math.abs(center - focus) * strength);
}

function setLoaded() {
  if (loaderClosed) return;
  loaderClosed = true;
  document.body.classList.add("is-loaded");
  if (loader) loader.setAttribute("aria-hidden", "true");
}

function updateActiveNav(stage) {
  navItems.forEach((item) => {
    item.classList.toggle("is-active", Number(item.dataset.nav) === stage);
  });
}

function updateDomMotion() {
  serviceNodes.forEach((card, index) => {
    const active = proximityToViewport(card, 0.57, 1.5);
    card.style.setProperty("--lift", `${(-34 * active + Math.sin(state.progress * Math.PI * 8 + index) * 4).toFixed(2)}px`);
    card.style.setProperty("--tilt", `${(5 - active * 9).toFixed(2)}deg`);
  });

  ritualItems.forEach((item, index) => {
    const active = proximityToViewport(item, 0.6, 1.65);
    item.style.setProperty("--lift", `${(-26 * active).toFixed(2)}px`);
    item.style.setProperty("--tilt", `${(4 - active * 7 + index * 0.35).toFixed(2)}deg`);
  });

  galleryItems.forEach((item, index) => {
    const active = proximityToViewport(item, 0.56, 1.35);
    item.style.setProperty("--lift", `${(-46 * active).toFixed(2)}px`);
    item.style.setProperty("--turn", `${((-8 + active * 16) * (index % 2 ? -1 : 1)).toFixed(2)}deg`);
  });

  signalItems.forEach((item, index) => {
    const active = proximityToViewport(item, 0.6, 1.7);
    item.style.setProperty("--lift", `${(-22 * active + index * 2).toFixed(2)}px`);
  });
}

function updateScrollState() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  state.targetProgress = clamp(window.scrollY / max);
  root.style.setProperty("--scroll", state.targetProgress.toFixed(4));

  if (header) header.classList.toggle("is-scrolled", window.scrollY > 30);

  let nearestStage = 0;
  let nearestDistance = Infinity;
  chapters.forEach((chapter, index) => {
    const rect = chapter.getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestStage = index;
    }
  });

  state.activeStage = nearestStage;
  root.style.setProperty("--stage", nearestStage);
  updateActiveNav(nearestStage);
  updateDomMotion();

  if (reducedMotion) renderThree(0);
}

function requestScrollUpdate() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    scrollTicking = false;
    updateScrollState();
  });
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
    { threshold: 0.13, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
  requestAnimationFrame(() => {
    revealItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) item.classList.add("is-visible");
    });
  });
}

function initGsapEnhancements() {
  if (reducedMotion || !window.gsap || !window.ScrollTrigger) return;

  window.gsap.registerPlugin(window.ScrollTrigger);
  window.gsap.utils.toArray(".chapter-copy, .chapter-heading").forEach((block) => {
    window.gsap.fromTo(
      block,
      { y: 42 },
      {
        y: 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: block,
          start: "top 82%",
          end: "top 46%",
          scrub: 0.75
        }
      }
    );
  });

  window.gsap.utils.toArray(".service-node, .gallery-strip figure, .signal-grid article").forEach((item) => {
    window.gsap.fromTo(
      item,
      { rotateX: 8, opacity: 0.92 },
      {
        rotateX: 0,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: item,
          start: "top 90%",
          end: "top 54%",
          scrub: true
        }
      }
    );
  });

  window.addEventListener("load", () => window.ScrollTrigger.refresh());
}

function makeBox(THREE, size, material, position, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return mesh;
}

function makeCylinder(THREE, radiusTop, radiusBottom, height, material, position, rotation = [0, 0, 0], segments = 32) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return mesh;
}

function makePhotoPanel(THREE, path, size, materialFallback, textureLoader) {
  const texture = textureLoader.load(path);
  if ("colorSpace" in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide
  });
  const group = new THREE.Group();
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat);
  const frame = makeBox(THREE, [size[0] + 0.06, size[1] + 0.06, 0.035], materialFallback, [0, 0, -0.035]);
  frame.scale.z = 0.55;
  group.add(frame, plane);
  return group;
}

function makeServiceObject(THREE, type, mats) {
  const group = new THREE.Group();

  if (type === "skin") {
    group.add(makeCylinder(THREE, 0.08, 0.1, 0.48, mats.glass, [0, 0.02, 0], [0, 0, 0], 28));
    group.add(makeBox(THREE, [0.12, 0.08, 0.12], mats.gold, [0, 0.31, 0]));
    group.add(makeBox(THREE, [0.18, 0.12, 0.018], mats.rose, [0, 0.03, 0.105]));
  }

  if (type === "laser") {
    group.add(makeBox(THREE, [0.36, 0.58, 0.28], mats.white, [0, 0.02, 0]));
    group.add(makeBox(THREE, [0.3, 0.14, 0.03], mats.teal, [0, 0.25, 0.16], [-0.18, 0, 0]));
    group.add(makeCylinder(THREE, 0.03, 0.03, 0.42, mats.gold, [0.23, 0.06, 0.1], [0.55, 0.15, 0.2], 16));
  }

  if (type === "lash") {
    const lash = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.012, 12, 80), mats.rose);
    lash.scale.set(1, 0.34, 1);
    lash.rotation.z = 0.16;
    group.add(lash);
    group.add(makeBox(THREE, [0.34, 0.035, 0.035], mats.gold, [0, -0.08, 0]));
  }

  if (type === "nail") {
    group.add(makeCylinder(THREE, 0.1, 0.1, 0.28, mats.rose, [0, -0.05, 0], [0, 0, 0], 28));
    group.add(makeCylinder(THREE, 0.055, 0.055, 0.34, mats.gold, [0, 0.25, 0], [0, 0, 0], 18));
    group.add(makeBox(THREE, [0.16, 0.16, 0.16], mats.dark, [0, 0.45, 0]));
  }

  if (type === "makeup") {
    group.add(makeCylinder(THREE, 0.025, 0.025, 0.6, mats.gold, [0, 0, 0], [0.2, 0, -0.55], 16));
    group.add(new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 24), mats.rose));
    group.children[group.children.length - 1].position.set(-0.18, 0.2, 0);
    group.children[group.children.length - 1].rotation.z = -0.55;
  }

  if (type === "body") {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.28, -0.04, 0),
      new THREE.Vector3(-0.12, 0.14, 0),
      new THREE.Vector3(0.1, -0.12, 0),
      new THREE.Vector3(0.3, 0.1, 0)
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.018, 8, false), mats.teal));
    group.add(makeCylinder(THREE, 0.08, 0.1, 0.22, mats.white, [0.28, -0.12, 0], [0, 0, -0.4], 18));
  }

  return group;
}

function captureMaterials(group) {
  const materials = [];
  group.traverse((node) => {
    if (!node.material) return;
    const list = Array.isArray(node.material) ? node.material : [node.material];
    list.forEach((material) => {
      if (materials.includes(material)) return;
      material.userData.baseOpacity = typeof material.opacity === "number" ? material.opacity : 1;
      if (material.userData.baseOpacity < 1) material.transparent = true;
      materials.push(material);
    });
  });
  return materials;
}

function setMaterialsFade(materials, fade) {
  materials.forEach((material) => {
    material.opacity = material.userData.baseOpacity * fade;
    material.transparent = material.opacity < 0.985 || material.transparent;
  });
}

function createThreeScene() {
  const canvas = document.getElementById("luxury-canvas");
  if (!canvas || !window.THREE) {
    root.classList.add("no-webgl");
    return;
  }

  const THREE = window.THREE;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    root.classList.add("no-webgl");
    return;
  }

  const mobile = window.innerWidth < 760;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.08 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);
  if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(mobile ? 42 : 36, window.innerWidth / window.innerHeight, 0.1, 80);
  const world = new THREE.Group();
  scene.add(world);

  const mats = {
    dark: new THREE.MeshStandardMaterial({ color: 0x151412, metalness: 0.2, roughness: 0.52 }),
    floor: new THREE.MeshStandardMaterial({ color: 0xd8d1c7, metalness: 0.12, roughness: 0.68, transparent: true, opacity: 0.34 }),
    white: new THREE.MeshStandardMaterial({ color: 0xfffbf4, metalness: 0.08, roughness: 0.36 }),
    rose: new THREE.MeshStandardMaterial({ color: 0xa72e63, metalness: 0.34, roughness: 0.32, transparent: true, opacity: 0.9 }),
    teal: new THREE.MeshStandardMaterial({ color: 0x2d756c, metalness: 0.34, roughness: 0.34, transparent: true, opacity: 0.9 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc7a062, metalness: 0.78, roughness: 0.28 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xfffaf2,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.36,
      thickness: 0.32,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide
    }),
    photoFrame: new THREE.MeshStandardMaterial({ color: 0xc7a062, metalness: 0.72, roughness: 0.35, transparent: true, opacity: 0.72 })
  };

  scene.add(new THREE.AmbientLight(0xf7f1e8, 1.1));

  const keyLight = new THREE.DirectionalLight(0xfff0d8, 2.7);
  keyLight.position.set(3.5, 5.2, 5.4);
  scene.add(keyLight);

  const roseLight = new THREE.PointLight(0xa72e63, 3.1, 12);
  roseLight.position.set(-3.5, 1.2, -2);
  scene.add(roseLight);

  const tealLight = new THREE.PointLight(0x2d756c, 2.7, 14);
  tealLight.position.set(3.2, 1.1, -6.8);
  scene.add(tealLight);

  const goldLight = new THREE.PointLight(0xc7a062, 2.2, 16);
  goldLight.position.set(0, 1.2, -12.5);
  scene.add(goldLight);

  const textureLoader = new THREE.TextureLoader();
  const stages = [];

  const corridor = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 18), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -1.22, -6);
  corridor.add(floor);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.7), mats.floor);
  backWall.position.set(0, 0.62, -13.9);
  backWall.material = mats.glass.clone();
  backWall.material.opacity = 0.18;
  corridor.add(backWall);

  for (let i = 0; i < 7; i += 1) {
    const strip = makeBox(THREE, [0.024, 0.024, 2.2], mats.gold, [-3 + i, -1.18, -2.3 - i * 1.55], [0, 0.6, 0]);
    strip.material = mats.gold.clone();
    strip.material.transparent = true;
    strip.material.opacity = 0.42;
    corridor.add(strip);
  }
  world.add(corridor);

  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.9, -1.08, 1.3),
    new THREE.Vector3(-0.7, -1.03, -1.4),
    new THREE.Vector3(0.8, -1.0, -4.9),
    new THREE.Vector3(-0.4, -1.0, -8.6),
    new THREE.Vector3(0.45, -0.96, -12.7)
  ]);
  const pathMesh = new THREE.Mesh(new THREE.TubeGeometry(path, 180, 0.012, 8, false), mats.gold);
  world.add(pathMesh);

  const clinic = new THREE.Group();
  clinic.position.z = -0.4;
  const bed = new THREE.Group();
  bed.add(makeBox(THREE, [2.62, 0.24, 1.03], mats.white, [0, -0.42, 0]));
  bed.add(makeBox(THREE, [0.86, 0.2, 0.94], mats.white, [-0.98, -0.2, 0]));
  bed.add(makeBox(THREE, [1.05, 0.08, 0.18], mats.gold, [0.48, -0.67, 0.53]));
  bed.add(makeBox(THREE, [1.05, 0.08, 0.18], mats.gold, [0.48, -0.67, -0.53]));
  bed.position.set(-0.6, -0.18, 0);
  bed.rotation.y = -0.2;
  clinic.add(bed);

  const device = new THREE.Group();
  device.add(makeBox(THREE, [0.42, 1.05, 0.38], mats.white, [0, -0.28, 0]));
  device.add(makeBox(THREE, [0.48, 0.26, 0.08], mats.teal, [0, 0.4, 0.19], [-0.18, 0, 0]));
  device.add(makeCylinder(THREE, 0.035, 0.035, 0.54, mats.gold, [0.32, 0.05, 0.1], [0.45, 0.1, -0.2], 16));
  device.position.set(1.45, -0.18, -0.08);
  clinic.add(device);

  const consoleTable = new THREE.Group();
  consoleTable.add(makeBox(THREE, [1.58, 0.42, 0.38], mats.dark, [0, -0.22, 0]));
  consoleTable.add(makeBox(THREE, [0.12, 0.62, 0.12], mats.gold, [-0.62, -0.72, 0.1]));
  consoleTable.add(makeBox(THREE, [0.12, 0.62, 0.12], mats.gold, [0.62, -0.72, 0.1]));
  consoleTable.position.set(0.25, -0.12, -1.45);
  clinic.add(consoleTable);

  const mirrorFrame = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 16, 96), mats.gold);
  mirrorFrame.scale.set(0.78, 1.22, 0.08);
  mirrorFrame.position.set(0.25, 0.74, -1.42);
  clinic.add(mirrorFrame);

  const mirrorGlass = new THREE.Mesh(new THREE.CircleGeometry(0.56, 48), mats.glass);
  mirrorGlass.scale.set(0.7, 1.1, 1);
  mirrorGlass.position.set(0.25, 0.74, -1.425);
  clinic.add(mirrorGlass);

  const heroPanelA = makePhotoPanel(THREE, "source-assets/kolayrandevu/gallery-04.jpg", [1.52, 1.12], mats.photoFrame, textureLoader);
  heroPanelA.position.set(-1.7, 0.75, -0.9);
  heroPanelA.rotation.y = 0.28;
  clinic.add(heroPanelA);

  const heroPanelB = makePhotoPanel(THREE, "source-assets/kolayrandevu/gallery-01.jpg", [1.3, 0.92], mats.photoFrame, textureLoader);
  heroPanelB.position.set(1.65, 0.58, -1.22);
  heroPanelB.rotation.y = -0.34;
  clinic.add(heroPanelB);

  world.add(clinic);
  stages.push({ group: clinic, index: 0, materials: captureMaterials(clinic) });

  const ritual = new THREE.Group();
  ritual.position.z = -2.85;
  for (let i = 0; i < 3; i += 1) {
    const gateway = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.018, 14, 80), i === 1 ? mats.teal : mats.gold);
    ring.scale.set(0.72, 1.25, 0.08);
    ring.position.y = 0.22;
    const slab = makeBox(THREE, [0.9, 1.34, 0.04], mats.glass, [0, 0.08, -0.02]);
    gateway.add(slab, ring);
    gateway.position.set(-1.2 + i * 1.2, -0.12 + Math.sin(i) * 0.08, 0);
    gateway.rotation.y = -0.32 + i * 0.28;
    ritual.add(gateway);
  }
  world.add(ritual);
  stages.push({ group: ritual, index: 1, materials: captureMaterials(ritual) });

  const services = new THREE.Group();
  services.position.z = -5.45;
  const serviceTypes = ["skin", "laser", "lash", "nail", "makeup", "body"];
  const servicePods = [];
  serviceTypes.forEach((type, index) => {
    const pod = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.IcosahedronGeometry(0.56, 2), mats.glass.clone());
    glass.material.opacity = 0.22;
    glass.scale.set(0.9, 1.16, 0.58);
    const object = makeServiceObject(THREE, type, mats);
    object.scale.setScalar(1.1);
    const plaque = makeBox(THREE, [0.82, 0.08, 0.04], index % 2 ? mats.teal : mats.rose, [0, -0.62, 0.04]);
    pod.add(glass, object, plaque);
    pod.position.set(-2.35 + (index % 3) * 2.35, index < 3 ? 0.45 : -0.82, index < 3 ? 0 : -0.72);
    pod.rotation.y = -0.34 + (index % 3) * 0.28;
    services.add(pod);
    servicePods.push(pod);
  });
  world.add(services);
  stages.push({ group: services, index: 2, materials: captureMaterials(services) });

  const gallery = new THREE.Group();
  gallery.position.z = -8.35;
  const galleryPaths = [
    "source-assets/kolayrandevu/gallery-02.jpg",
    "source-assets/kolayrandevu/gallery-03.jpg",
    "source-assets/kolayrandevu/gallery-04.jpg",
    "source-assets/kolayrandevu/gallery-07.jpg",
    "source-assets/kolayrandevu/gallery-08.jpg",
    "source-assets/kolayrandevu/gallery-10.jpg"
  ];
  const galleryPanels = galleryPaths.map((pathName, index) => {
    const panel = makePhotoPanel(THREE, pathName, [1.52, 1.08], mats.photoFrame, textureLoader);
    const col = index % 3;
    const row = Math.floor(index / 3);
    panel.position.set(-2.05 + col * 2.05, 0.54 - row * 1.28, -row * 0.42);
    panel.rotation.y = -0.42 + col * 0.42;
    gallery.add(panel);
    return panel;
  });
  world.add(gallery);
  stages.push({ group: gallery, index: 3, materials: captureMaterials(gallery) });

  const proof = new THREE.Group();
  proof.position.z = -10.9;
  const signalColors = [mats.rose, mats.gold, mats.teal, mats.white];
  for (let i = 0; i < 4; i += 1) {
    const block = new THREE.Group();
    block.add(makeBox(THREE, [0.9, 0.62, 0.08], signalColors[i], [0, 0, 0]));
    block.add(makeCylinder(THREE, 0.12, 0.12, 0.05, mats.glass, [0.28, 0.2, 0.08], [Math.PI / 2, 0, 0], 24));
    block.position.set(-1.7 + i * 1.14, 0.12 + Math.sin(i) * 0.12, 0);
    block.rotation.y = -0.2 + i * 0.12;
    proof.add(block);
  }
  world.add(proof);
  stages.push({ group: proof, index: 4, materials: captureMaterials(proof) });

  const contact = new THREE.Group();
  contact.position.z = -13.15;
  contact.add(makeBox(THREE, [2.7, 1.55, 0.18], mats.white, [0, 0, 0]));
  contact.add(makeBox(THREE, [2.28, 0.18, 0.04], mats.rose, [0, 0.42, 0.14]));
  contact.add(makeBox(THREE, [1.7, 0.14, 0.04], mats.teal, [0, 0.08, 0.14]));
  contact.add(makeBox(THREE, [1.2, 0.14, 0.04], mats.gold, [0, -0.24, 0.14]));
  contact.add(makeCylinder(THREE, 0.32, 0.32, 0.032, mats.gold, [1.58, 0.15, 0.05], [Math.PI / 2, 0, 0], 48));
  world.add(contact);
  stages.push({ group: contact, index: 5, materials: captureMaterials(contact) });

  const curtainMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      progress: { value: 0 },
      colorA: { value: new THREE.Color(0xa72e63) },
      colorB: { value: new THREE.Color(0xc7a062) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      uniform float progress;
      uniform vec3 colorA;
      uniform vec3 colorB;
      void main() {
        float scan = sin((vUv.y * 18.0) + time * 1.2 + progress * 10.0) * 0.5 + 0.5;
        float edge = smoothstep(0.05, 0.46, vUv.x) * smoothstep(0.95, 0.54, vUv.x);
        vec3 color = mix(colorA, colorB, vUv.y + scan * 0.16);
        gl_FragColor = vec4(color, edge * scan * 0.18);
      }
    `
  });
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.8), curtainMaterial);
  curtain.position.set(0, 0.35, -6.6);
  curtain.rotation.y = -0.18;
  world.add(curtain);

  const particleCount = mobile ? 260 : 720;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    particlePositions[i * 3] = -3.8 + Math.random() * 7.6;
    particlePositions[i * 3 + 1] = -1.1 + Math.random() * 3.4;
    particlePositions[i * 3 + 2] = 1.8 - Math.random() * 16.4;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0xf6e4c0,
      size: mobile ? 0.018 : 0.014,
      transparent: true,
      opacity: 0.48
    })
  );
  world.add(particles);

  const cameraStops = [
    { pos: [-0.1, 1.55, 7.25], target: [0, 0.02, -0.62] },
    { pos: [1.05, 1.35, 4.35], target: [0, 0.02, -2.8] },
    { pos: [-0.85, 1.25, 1.38], target: [0, -0.02, -5.48] },
    { pos: [0.4, 1.12, -2.18], target: [0, 0.08, -8.46] },
    { pos: [-1.1, 1.28, -5.78], target: [0, 0.05, -10.92] },
    { pos: [0.2, 1.08, -9.05], target: [0, 0.02, -13.1] }
  ];

  stages.forEach((stage) => {
    stage.group.userData.baseY = stage.group.position.y;
  });
  servicePods.forEach((pod) => {
    pod.userData.baseY = pod.position.y;
    pod.userData.baseRotY = pod.rotation.y;
  });
  galleryPanels.forEach((panel) => {
    panel.userData.baseZ = panel.position.z;
    panel.userData.baseRotY = panel.rotation.y;
  });

  threeState = {
    THREE,
    renderer,
    scene,
    camera,
    world,
    stages,
    servicePods,
    galleryPanels,
    bed,
    device,
    mirrorFrame,
    particles,
    curtainMaterial,
    cameraStops
  };

  root.classList.add("webgl-ready");
  resizeThree();
  renderThree(0);
  setLoaded();
}

function resizeThree() {
  if (!threeState) return;
  const { renderer, camera } = threeState;
  const mobile = window.innerWidth < 760;
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.08 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = mobile ? 42 : 36;
  camera.updateProjectionMatrix();
}

function fadeForStage(stageFloat, index) {
  return clamp(1.18 - Math.abs(stageFloat - index) * 0.68, 0.08, 1);
}

function renderThree(time = 0) {
  if (!threeState) return;

  const {
    THREE,
    renderer,
    scene,
    camera,
    world,
    stages,
    servicePods,
    galleryPanels,
    bed,
    device,
    mirrorFrame,
    particles,
    curtainMaterial,
    cameraStops
  } = threeState;

  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const liveProgress = clamp(window.scrollY / maxScroll);
  if (Math.abs(liveProgress - state.targetProgress) > 0.0005) {
    state.targetProgress = liveProgress;
    root.style.setProperty("--scroll", liveProgress.toFixed(4));
    updateActiveNav(Math.round(liveProgress * (chapters.length - 1)));
  }

  const t = time * 0.001;
  const smoothing = reducedMotion ? 1 : 0.075;
  state.progress = lerp(state.progress, state.targetProgress, smoothing);
  const stageFloat = state.progress * (cameraStops.length - 1);
  const stageIndex = Math.min(cameraStops.length - 2, Math.floor(stageFloat));
  const stageLocal = smoothstep(stageFloat - stageIndex);
  const from = cameraStops[stageIndex];
  const to = cameraStops[stageIndex + 1];
  const pos = mixArray(from.pos, to.pos, stageLocal);
  const target = mixArray(from.target, to.target, stageLocal);
  const mobile = window.innerWidth < 760;

  camera.position.set(
    pos[0] + state.mouseX * (mobile ? 0.05 : 0.16),
    pos[1] + state.mouseY * (mobile ? 0.035 : 0.08),
    pos[2] + (mobile ? 0.8 : 0)
  );
  camera.lookAt(new THREE.Vector3(target[0], target[1], target[2]));

  world.rotation.y = state.mouseX * 0.035;
  world.position.x = mobile ? 0.12 : 0;

  stages.forEach((stage) => {
    const fade = fadeForStage(stageFloat, stage.index);
    setMaterialsFade(stage.materials, fade);
    stage.group.visible = fade > 0.11;
    stage.group.position.y = stage.group.userData.baseY + Math.sin(t * 0.55 + stage.index) * (reducedMotion ? 0 : 0.018);
  });

  bed.position.y = -0.18 + Math.sin(t * 0.8) * (reducedMotion ? 0 : 0.018);
  device.rotation.y = Math.sin(t * 0.55) * 0.06 + smoothstep(clamp(stageFloat - 0.7, 0, 1)) * 0.16;
  mirrorFrame.rotation.z = Math.sin(t * 0.42) * (reducedMotion ? 0 : 0.018);

  servicePods.forEach((pod, index) => {
    const focus = clamp(1 - Math.abs((stageFloat - 2) * 0.72 - (index - 2.5) * 0.14), 0, 1);
    pod.rotation.y = pod.userData.baseRotY + (reducedMotion ? 0 : t * (0.18 + index * 0.018));
    pod.position.y = pod.userData.baseY + Math.sin(t * 0.75 + index) * (reducedMotion ? 0 : 0.035);
    pod.scale.setScalar(0.92 + focus * 0.16);
  });

  galleryPanels.forEach((panel, index) => {
    const wave = smoothstep(clamp(stageFloat - 2.85, 0, 1));
    panel.position.z = panel.userData.baseZ + wave * (index % 2 ? 0.22 : -0.12);
    panel.rotation.y = panel.userData.baseRotY + Math.sin(t * 0.28 + index) * (reducedMotion ? 0 : 0.025);
  });

  particles.rotation.y = t * (reducedMotion ? 0 : 0.028) + state.progress * 0.42;
  particles.position.z = Math.sin(t * 0.24) * (reducedMotion ? 0 : 0.08);
  curtainMaterial.uniforms.time.value = t;
  curtainMaterial.uniforms.progress.value = state.progress;

  renderer.render(scene, camera);
}

function animate(time) {
  renderThree(time);
  if (!reducedMotion) requestAnimationFrame(animate);
}

function handlePointer(event) {
  const point = event.touches ? event.touches[0] : event;
  state.mouseX = clamp(point.clientX / window.innerWidth - 0.5, -0.5, 0.5);
  state.mouseY = clamp(point.clientY / window.innerHeight - 0.5, -0.5, 0.5);
}

function start() {
  initReveal();
  initGsapEnhancements();
  createThreeScene();
  updateScrollState();
  requestAnimationFrame(animate);

  if (document.readyState === "complete") {
    setLoaded();
  } else {
    window.addEventListener("load", setLoaded, { once: true });
    window.setTimeout(setLoaded, 1200);
  }
}

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", () => {
  resizeThree();
  updateScrollState();
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
});
window.addEventListener("mousemove", handlePointer, { passive: true });
window.addEventListener("touchmove", handlePointer, { passive: true });

start();
