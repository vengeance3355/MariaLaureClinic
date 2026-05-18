const header = document.querySelector("[data-header]");
const revealItems = document.querySelectorAll("[data-reveal]");
const parallaxItems = document.querySelectorAll("[data-parallax]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion) {
  document.documentElement.classList.add("can-animate");
}

function updateScrollState() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  document.documentElement.style.setProperty("--scroll", progress.toFixed(4));

  if (header) {
    header.classList.toggle("is-scrolled", window.scrollY > 26);
  }

  if (!reducedMotion) {
    parallaxItems.forEach((item) => {
      const speed = Number(item.dataset.parallax || 0);
      const rect = item.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      item.style.transform = `translate3d(0, ${centerOffset * speed * -0.18}px, 0)`;
    });
  }
}

if ("IntersectionObserver" in window) {
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
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));

  requestAnimationFrame(() => {
    revealItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
        const delay = item.dataset.revealDelay;
        if (delay) item.style.setProperty("--delay", `${delay}ms`);
        item.classList.add("is-visible");
      }
    });
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);
updateScrollState();
