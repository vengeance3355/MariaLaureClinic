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
  activeStage: 0
};

let scrollTicking = false;
let loaderClosed = false;

if (!reducedMotion) root.classList.add("can-animate");

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
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
  state.progress = state.targetProgress;
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

function initLuxuryParticles() {
  const target = document.getElementById("particles-js");
  if (!target || !window.particlesJS) return;

  const mobile = window.innerWidth < 760;
  const particleCount = reducedMotion ? (mobile ? 24 : 42) : (mobile ? 58 : 110);
  const particleSpeed = reducedMotion ? 1.2 : (mobile ? 2.1 : 3.2);

  window.particlesJS("particles-js", {
    particles: {
      number: {
        value: particleCount,
        density: {
          enable: true,
          value_area: mobile ? 520 : 880
        }
      },
      color: {
        value: ["#c7a062", "#d0678d", "#2d756c", "#fffaf2"]
      },
      shape: {
        type: "circle",
        stroke: {
          width: 0,
          color: "#000000"
        }
      },
      opacity: {
        value: reducedMotion ? 0.3 : 0.44,
        random: true,
        anim: {
          enable: true,
          speed: reducedMotion ? 0.24 : 0.68,
          opacity_min: reducedMotion ? 0.14 : 0.1,
          sync: false
        }
      },
      size: {
        value: mobile ? 1.8 : 2.25,
        random: true,
        anim: {
          enable: false,
          speed: 0,
          size_min: 0.4,
          sync: false
        }
      },
      line_linked: {
        enable: true,
        distance: mobile ? 112 : 148,
        color: "#c7a062",
        opacity: mobile ? 0.16 : 0.22,
        width: 1
      },
      move: {
        enable: true,
        speed: particleSpeed,
        direction: "none",
        random: true,
        straight: false,
        out_mode: "out",
        bounce: false,
        attract: {
          enable: false,
          rotateX: 600,
          rotateY: 1200
        }
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: {
          enable: false,
          mode: "grab"
        },
        onclick: {
          enable: false,
          mode: "push"
        },
        resize: true
      },
      modes: {
        grab: {
          distance: 0,
          line_linked: {
            opacity: 0
          }
        },
        bubble: {
          distance: 0,
          size: 0,
          duration: 0,
          opacity: 0,
          speed: 0
        },
        repulse: {
          distance: 0,
          duration: 0
        },
        push: {
          particles_nb: 0
        },
        remove: {
          particles_nb: 0
        }
      }
    },
    retina_detect: true
  });
}

function start() {
  initLuxuryParticles();
  initReveal();
  initGsapEnhancements();
  updateScrollState();

  if (document.readyState === "complete") {
    setLoaded();
  } else {
    window.addEventListener("load", setLoaded, { once: true });
    window.setTimeout(setLoaded, 1200);
  }
}

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", () => {
  updateScrollState();
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
});
start();
