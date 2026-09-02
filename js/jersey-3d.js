// Skyline Velo Cycling Club — real 3D jersey model, scroll-driven rotation + framing.
// Model: assets/jersey.glb (free CC-Attribution "Cycling Jersey" model by Sev/@sevclothing on
// Sketchfab — https://sketchfab.com/3d-models/cycling-jersey-a92dcbd8c126486eb22b008b8f4a8b27 —
// front-print texture recolored white/orange to match the club palette; credited in the footer).
//
// Honest limitation: this model's geometry doesn't give confident evidence of 3 separate,
// identifiable rear-pocket meshes, so the "pocket" stages don't zoom onto 3 individually verified
// pocket shapes (that would be guessing blind). Instead they zoom into the garment's lower-back
// band (the anatomically real area where pockets sit on any jersey) while staying centered — no
// horizontal panning, since panning would need to correctly un-rotate as the model spins, and
// getting that sign-flip wrong blind is exactly the kind of mistake to avoid here.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

gsap.from('.hero-title .line', {
  y: 40,
  opacity: 0,
  duration: 0.9,
  stagger: 0.12,
  ease: 'power3.out',
  delay: 0.2,
});
gsap.from('.hero-eyebrow, .scroll-cue', {
  y: 20,
  opacity: 0,
  duration: 0.8,
  delay: 0.6,
  ease: 'power3.out',
});

const canvas = document.querySelector('#jerseyCanvas');
const stage = document.querySelector('#jerseyPin');
const loadingEl = document.querySelector('#jerseyLoading');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
// Was capped at 2x — raised so the render is sharper on high-DPI screens. This is a rendering-
// resolution fix (how many pixels get drawn), not a geometry fix — the underlying mesh's polygon
// density is unchanged, so if what actually looked "low-res" was the model's shape/silhouette
// rather than blur/aliasing, this alone won't fix that (that would mean actual mesh subdivision,
// a separate and riskier change — say so if this doesn't look like what you meant).
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

// Lower ambient so directional shading actually reads instead of getting flattened out, and put
// the key light straight overhead — like a single light in Blender positioned above the model,
// with only the render of the jersey shown, no visible light source or glow trick.
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const overheadLight = new THREE.DirectionalLight(0xffffff, 3.2);
overheadLight.position.set(0, 7, 0.6); // nearly straight up — strong falloff toward camera-facing surfaces
overheadLight.target.position.set(0, 0, 0);
scene.add(overheadLight);
scene.add(overheadLight.target);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.12);
fillLight.position.set(0, -1, 4); // soft light from the front-low, just keeps the underside from crushing to black
scene.add(fillLight);

function resize() {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let jerseyModel = null;

new GLTFLoader().load(
  'assets/jersey.glb',
  (gltf) => {
    const model = gltf.scene;

    // The source file's materials have an empty pbrMetallicRoughness, so glTF's spec default
    // applies: fully metallic, fully rough. With no environment map to reflect, that renders as
    // flat dark grey regardless of texture color — not a texture problem, a shading one. And since
    // emissiveFactor defaults to black, the recolored texture (wired as an emissive map) was being
    // multiplied by black and never showing at all. Fix both: force it to behave like matte fabric
    // lit normally, and make the emissive map actually visible.
    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      // The source mesh's shading looks faceted at the higher light contrast above — recomputing
      // smooth vertex normals (shared across adjacent faces, instead of whatever hard/flat normals
      // the file shipped with) is the standard fix when a model reads as low-poly under strong
      // directional light. Doesn't change the actual geometry/silhouette, just how it's shaded.
      if (child.geometry) child.geometry.computeVertexNormals();
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (mat.emissiveMap) {
          mat.emissive.set(0xffffff);
          // emissive is flat/unlit regardless of scene lighting — at full intensity it acts as a
          // brightness floor that would fight the dramatic overhead shading below. Lower so real
          // shadow can actually show while the orange collar still reads as orange.
          mat.emissiveIntensity = 0.8;
        }
        // The diffuse base color defaults to white and is lit separately, additive with the
        // emissive layer above — leaving it white was why a grey texture still rendered lighter
        // than intended (white diffuse + grey emissive stacks toward white). Tinting it to match
        // keeps the two layers from fighting each other.
        mat.color.set(0x123b2a); // matches the forest-green texture base — see the comment above
        mat.metalness = 0.1;
        mat.roughness = 0.85;
        mat.flatShading = false;
        mat.needsUpdate = true;
      });
    });

    model.updateMatrixWorld(true); // must run before measuring bounds, or Box3 reads stale matrices

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // offset is in the model's own (huge) unit scale — applying it as a child of a group (scaled
    // separately below) means the offset gets scaled down along with the geometry. Doing both on
    // the same node was the earlier bug: an unscaled offset shoved the shrunk model out of frame.
    model.position.sub(center);

    const group = new THREE.Group();
    group.add(model);
    scene.add(group);
    jerseyModel = group;
    jerseyModel.userData.size = size; // keep real measured size for the framing math below

    frameHero();
    loadingEl.classList.add('loaded');
    buildScrollTimeline();
  },
  undefined,
  (err) => {
    console.error('jersey model failed to load:', err);
    loadingEl.textContent = 'Model failed to load';
  }
);

// "Large, centered, only the top ~2/3 visible" — computed from real camera geometry, not eyeballed
// numbers: figure out how tall the model needs to render for 2/3 of it to fill the visible frame
// height, then shift it up so the top stays near the top of frame and the rest crops below.
function frameHero() {
  const size = jerseyModel.userData.size;
  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const targetVisibleFraction = 2 / 3;
  const targetTotalHeight = visibleHeight / targetVisibleFraction;
  const scale = targetTotalHeight / size.y;

  jerseyModel.scale.setScalar(scale);
  const renderedHalfHeight = (size.y * scale) / 2;
  const topOfFrame = visibleHeight / 2;
  jerseyModel.userData.heroY = topOfFrame - renderedHalfHeight;
  jerseyModel.userData.heroScale = scale;
  jerseyModel.position.y = jerseyModel.userData.heroY;
}

(function renderLoop() {
  requestAnimationFrame(renderLoop);
  renderer.render(scene, camera);
})();

function buildScrollTimeline() {
  gsap.registerPlugin(ScrollTrigger);
  const jerseyPin = document.querySelector('#jerseyPin');
  if (!jerseyPin) return;

  const size = jerseyModel.userData.size;
  const heroScale = jerseyModel.userData.heroScale;
  const heroY = jerseyModel.userData.heroY;

  // Rotation around Y doesn't change a point's Y-coordinate, so this vertical framing math stays
  // correct regardless of which way the model is currently facing — no sign-flip risk.
  const pocketScale = heroScale * 1.55;
  // Was -0.38 (pushed the model up too far, per feedback — the pocket band was landing near the
  // top of frame with a lot of blank hem below it). Reduced toward center so it settles where the
  // centered text already sits, rather than moving the text to chase the model.
  const pocketBandLocalY = -size.y * 0.2;
  const pocketY = -pocketBandLocalY * pocketScale;

  const panelBack = '#panelBack';
  const panel1 = '#panel1';
  const panel2 = '#panel2';
  const panel3 = '#panel3';

  gsap.set([panelBack, panel1, panel2, panel3], { opacity: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: jerseyPin,
      start: 'top top',
      end: '+=4400',
      scrub: 0.7,
      pin: true,
    },
  });

  // Stage 1: rotate front -> back, hero text out, origin story in.
  tl.to('.front-overlay', { opacity: 0, duration: 0.4 })
    .to(jerseyModel.rotation, { y: Math.PI, duration: 1, ease: 'power2.inOut' }, '<')
    .to(panelBack, { opacity: 1, duration: 0.4 }, '-=0.3')

  // Stage 2: pocket one — the schedule. Zoom into the lower-back band.
    .to(panelBack, { opacity: 0, duration: 0.3 }, '+=0.5')
    .to(jerseyModel.scale, { x: pocketScale, y: pocketScale, z: pocketScale, duration: 0.7, ease: 'power2.inOut' }, '<')
    .to(jerseyModel.position, { y: pocketY, duration: 0.7, ease: 'power2.inOut' }, '<')
    .to(panel1, { opacity: 1, duration: 0.4 }, '<0.2')

  // Stage 3: pocket two — join. Small rotational nudge so it doesn't feel static, same zoom band.
    .to(panel1, { opacity: 0, duration: 0.3 }, '+=0.5')
    .to(jerseyModel.rotation, { y: Math.PI * 1.12, duration: 0.6, ease: 'sine.inOut' }, '<')
    .to(panel2, { opacity: 1, duration: 0.4 }, '<0.2')

  // Stage 4: pocket three — the leaderboard.
    .to(panel2, { opacity: 0, duration: 0.3 }, '+=0.5')
    .to(jerseyModel.rotation, { y: Math.PI * 0.88, duration: 0.6, ease: 'sine.inOut' }, '<')
    .to(panel3, { opacity: 1, duration: 0.4 }, '<0.2')

    .to({}, { duration: 0.6 });
}
