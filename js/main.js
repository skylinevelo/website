// Skyline Velo Cycling Club — traditional site, real scroll mechanics.
// Replaces the earlier 3D jersey concept (retired 2026-09-01 — see decisions-log.md). The GLB
// pipeline (website/scripts/recolor_jersey.py, jersey.glb) is left in place, not deleted, in case
// it's useful for something later (e.g. an interactive kit preview), but nothing on the live site
// loads Three.js anymore — that's real page weight this site doesn't need right now.

gsap.registerPlugin(ScrollTrigger);

// Opening-scene entrance on load — scoped to the first scene's card only. Scenes 1 & 2 start at
// opacity 0 and are brought in purely by scroll progress (see buildSceneScroll below), never by
// this load-time tween.
gsap.set('#sceneLabel0', { opacity: 1 });
gsap.from('#sceneLabel0 .scene-card', {
  y: 24,
  opacity: 0,
  duration: 0.8,
  delay: 0.3,
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

// Opening scene: pins the section for a single scrubbed timeline that plays three sequential
// beats per chapter change — card text fades out, THEN the tall illustration shifts up to the next
// chapter, THEN the new card's text fades in — rather than a continuous crossfade. Track height is
// 3x the pin height by design (.scene-track in css/style.css is 300vh), so it always has exactly
// two chapter-shifts' worth of travel regardless of viewport size.
function buildSceneScroll() {
  const pin = document.querySelector('#scenePin');
  const track = document.querySelector('#sceneTrack');
  const labels = [
    document.querySelector('#sceneLabel0'),
    document.querySelector('#sceneLabel1'),
    document.querySelector('#sceneLabel2'),
  ];
  const bars = document.querySelectorAll('.scene-card .bar');
  if (!pin || !track || labels.some((l) => !l)) return;

  ScrollTrigger.getById('sceneScroll')?.kill();

  const distance = track.scrollHeight - pin.clientHeight;
  if (distance <= 0) return;
  const step = distance / 2;

  gsap.set(labels[0], { opacity: 1 });
  gsap.set([labels[1], labels[2]], { opacity: 0 });
  gsap.set(track, { y: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      id: 'sceneScroll',
      trigger: pin,
      start: 'top top',
      end: () => '+=' + pin.clientHeight * 4.5,
      scrub: true,
      pin: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        bars.forEach((bar) => bar.style.setProperty('--scroll-progress', (self.progress * 100).toFixed(1) + '%'));
      },
    },
  });

  tl.to(labels[0], { opacity: 0, duration: 1 })
    .to(track, { y: -step, duration: 1.6, ease: 'power1.inOut' })
    .to(labels[1], { opacity: 1, duration: 1 })
    .to({}, { duration: 1.6 }) // hold — reading time on Old La Honda
    .to(labels[1], { opacity: 0, duration: 1 })
    .to(track, { y: -distance, duration: 1.6, ease: 'power1.inOut' })
    .to(labels[2], { opacity: 1, duration: 1 })
    .to({}, { duration: 1.6 }); // hold at West Alpine Road
}

buildSceneScroll();
window.addEventListener('resize', () => {
  clearTimeout(window._sceneResizeTimer);
  window._sceneResizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
});
