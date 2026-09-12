// Skyline Velo Cycling Club — traditional site, real scroll mechanics.
// Replaces the earlier 3D jersey concept (retired 2026-09-01 — see decisions-log.md). The GLB
// pipeline (website/scripts/recolor_jersey.py, jersey.glb) is left in place, not deleted, in case
// it's useful for something later (e.g. an interactive kit preview), but nothing on the live site
// loads Three.js anymore — that's real page weight this site doesn't need right now.

gsap.registerPlugin(ScrollTrigger);

// Hero entrance on load. The hero used to be a 3-chapter pinned-scroll scene (Old La Honda + West
// Alpine were part of it) — simplified to a single static scene on 2026-09-09, see
// decisions-log.md, so this is now just a plain load-time fade-in, no scroll-driven pin/scrub.
gsap.set('#sceneLabel0', { opacity: 1 });
gsap.from('#sceneLabel0 .hero-eyebrow, #sceneLabel0 .sky-title .line', {
  y: 24,
  opacity: 0,
  duration: 0.8,
  stagger: 0.1,
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

// The pinned/scrubbed multi-chapter scroll timeline that used to live here (buildSceneScroll) was
// removed 2026-09-09 along with the Old La Honda / West Alpine hero chapters — see
// decisions-log.md. The hero is now a single static scene, nothing left to scrub between.

// Formspree AJAX submit — shared by the join-interest form (join.html) and the waiver
// e-signature form (waiver.html), added 2026-09-12. Posts with an Accept: application/json header
// so Formspree responds with JSON instead of redirecting, and swaps the form for an inline
// confirmation message instead of navigating away.
function bindFormspreeForm(formId, statusId, successMessage) {
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  if (!form || !status) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (form.action.includes('REPLACE_WITH_')) {
      status.textContent = 'Form isn’t connected yet — the site owner still needs to add a real Formspree endpoint.';
      status.classList.add('error');
      return;
    }
    status.textContent = 'Sending…';
    status.classList.remove('error');
    if (submitBtn) submitBtn.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        form.hidden = true;
        status.textContent = successMessage;
      } else {
        status.textContent = 'Something went wrong sending that — please try again, or reach out directly (see links above).';
        status.classList.add('error');
      }
    } catch (err) {
      status.textContent = 'Something went wrong sending that — please try again, or reach out directly (see links above).';
      status.classList.add('error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
