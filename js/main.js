// Skyline Velo Cycling Club — traditional site, real scroll mechanics.
// Replaces the earlier 3D jersey concept (retired 2026-09-01 — see decisions-log.md). The GLB
// pipeline (website/scripts/recolor_jersey.py, jersey.glb) is left in place, not deleted, in case
// it's useful for something later (e.g. an interactive kit preview), but nothing on the live site
// loads Three.js anymore — that's real page weight this site doesn't need right now.

gsap.registerPlugin(ScrollTrigger);

// Hero entrance on load.
gsap.from('.hero-title .line', {
  y: 40,
  opacity: 0,
  duration: 0.9,
  stagger: 0.12,
  ease: 'power3.out',
  delay: 0.2,
});
gsap.from('.hero-eyebrow, .hero-sub, .scroll-cue', {
  y: 20,
  opacity: 0,
  duration: 0.8,
  delay: 0.5,
  ease: 'power3.out',
});

// Generic reveal-on-scroll for any section marked .reveal.
// Starting state (y offset) must be set BEFORE the tween is created, or GSAP captures the
// element's current (already-zero) position as the start and the slide-up motion never happens.
document.querySelectorAll('.reveal').forEach((el) => {
  gsap.set(el, { y: 40 });
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 82%' },
  });
});

// Mobile nav toggle — hamburger opens a slide-in panel, closes on link tap or a second toggle.
const navToggle = document.querySelector('#navToggle');
const navLinks = document.querySelector('#navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.innerHTML = isOpen ? '&times;' : '&#9776;';
  });
  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.innerHTML = '&#9776;';
    });
  });
}

// Nav goes solid once you've scrolled past the top of the page, so links stay readable over
// whatever section is underneath instead of just the hero. Plain scroll listener, not
// ScrollTrigger — this is a simple on/off toggle, doesn't need pinning or scrubbing.
const siteNav = document.querySelector('#siteNav');
if (siteNav) {
  window.addEventListener('scroll', () => {
    siteNav.classList.toggle('scrolled', window.scrollY > 80);
  });
}

// Horizontal-scroll gallery: pins the section while the track slides sideways as the page scrolls
// down. Recalculates on resize since card widths are viewport-relative (min(70vw, 420px)).
function buildGalleryScroll() {
  const pin = document.querySelector('#galleryPin');
  const track = document.querySelector('#galleryTrack');
  if (!pin || !track) return;

  ScrollTrigger.getById('galleryScroll')?.kill();

  const distance = track.scrollWidth - pin.clientWidth;
  if (distance <= 0) return; // track fits without scrolling — nothing to pin

  gsap.to(track, {
    x: -distance,
    ease: 'none',
    scrollTrigger: {
      id: 'galleryScroll',
      trigger: pin,
      start: 'top top',
      end: () => '+=' + distance,
      scrub: true,
      pin: true,
      invalidateOnRefresh: true,
    },
  });
}

buildGalleryScroll();
window.addEventListener('resize', () => {
  clearTimeout(window._galleryResizeTimer);
  window._galleryResizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
});
