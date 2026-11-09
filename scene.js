// Full-screen 3D particle field behind the story. About 2,000 points reshape for each chapter:
// globe (prologue) → human + machine (belief) → data wave (proof) → helix (journey) → blocks (work)
// → knot (toolkit) → globe (epilogue). Decorative only: without WebGL the page simply has no background.
import * as THREE from './vendor/three.module.min.js'; // three.js r160, served with the site (no CDN dependency)

const canvas = document.getElementById('scene');
const still = window.matchMedia('(prefers-reduced-motion: reduce)');
const N = 2000;

// ---------- Shapes (each returns N positions) ----------
const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const shapes = {
    globe() {
        const p = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
            p.set([Math.cos(th) * r * 2.3, y * 2.3, Math.sin(th) * r * 2.3], i * 3);
        }
        return p;
    },
    // left: a soft organic "human" cloud; right: a precise "machine" lattice
    duo() {
        const p = new Float32Array(N * 3);
        const half = N / 2;
        for (let i = 0; i < half; i++) {
            const u = rand() * Math.PI * 2, v = Math.acos(2 * rand() - 1);
            const r = 1.45 * (0.82 + 0.18 * Math.sin(u * 3) * Math.sin(v * 2)) * Math.cbrt(0.55 + rand() * 0.45);
            p.set([-2.1 + r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u)], i * 3);
        }
        const side = Math.ceil(Math.cbrt(half));
        for (let i = 0; i < N - half; i++) {
            const x = i % side, y = Math.floor(i / side) % side, z = Math.floor(i / (side * side));
            const s = 2.5 / (side - 1);
            p.set([2.1 - 1.25 + x * s, -1.25 + y * s, -1.25 + z * s], (half + i) * 3);
        }
        return p;
    },
    wave() {
        const p = new Float32Array(N * 3);
        const cols = 50, rows = Math.ceil(N / cols);
        for (let i = 0; i < N; i++) {
            const c = i % cols, r = Math.floor(i / cols);
            const x = -4.4 + (c / (cols - 1)) * 8.8, z = -2.4 + (r / (rows - 1)) * 4.8;
            p.set([x, Math.sin(x * 0.9) * 0.45 + Math.cos(z * 1.3) * 0.35 - 0.6, z], i * 3);
        }
        return p;
    },
    helix() {
        const p = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const t = i / N, strand = i % 2, a = t * Math.PI * 9 + strand * Math.PI;
            const rung = i % 23 === 0 ? rand() * 2 - 1 : 1;
            p.set([-4.4 + t * 8.8, Math.cos(a) * 1.05 * rung, Math.sin(a) * 1.05 * rung], i * 3);
        }
        return p;
    },
    blocks() {
        const p = new Float32Array(N * 3);
        const boxes = [[-1.5, -1.1, 0, 1.3], [0, -1.1, 0, 1.3], [1.5, -1.1, 0, 1.3], [-0.75, 0.3, 0, 1.3], [0.75, 0.3, 0, 1.3], [0, 1.7, 0, 1.3]];
        for (let i = 0; i < N; i++) {
            const [cx, cy, cz, s] = boxes[i % boxes.length];
            const face = Math.floor(rand() * 6), a = rand() - 0.5, b = rand() - 0.5, h = s / 2;
            const q = [[h, a * s, b * s], [-h, a * s, b * s], [a * s, h, b * s], [a * s, -h, b * s], [a * s, b * s, h], [a * s, b * s, -h]][face];
            p.set([cx + q[0] * 0.92, cy + q[1] * 0.92, cz + q[2] * 0.92], i * 3);
        }
        return p;
    },
    ring() {
        const p = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const u = (i / N) * Math.PI * 2, v = rand() * Math.PI * 2, R = 2.3, r = 0.28 + rand() * 0.12;
            p.set([(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v) * 1.4, (R + r * Math.cos(v)) * Math.sin(u)], i * 3);
        }
        return p;
    },
    knot() {
        const p = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const t = (i / N) * Math.PI * 2, pp = 2, q = 3;
            const r = 1.3 + 0.55 * Math.cos(q * t);
            const jitter = 0.18;
            p.set([
                r * Math.cos(pp * t) + (rand() - 0.5) * jitter,
                r * Math.sin(pp * t) + (rand() - 0.5) * jitter,
                0.55 * Math.sin(q * t) * 1.6 + (rand() - 0.5) * jitter,
            ], i * 3);
        }
        return p;
    },
};

function start() {
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) {
        return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 9);
    const group = new THREE.Group();
    scene.add(group);

    // ---------- Chapters → shapes ----------
    const sections = [...document.querySelectorAll('[data-formation]')];
    const formations = sections.map((s) => s.dataset.formation);
    const cache = {};
    const positionsFor = (name) => (cache[name] ||= shapes[name]());

    // round, soft dot
    const dot = document.createElement('canvas');
    dot.width = dot.height = 64;
    const g = dot.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);

    const current = new Float32Array(positionsFor(formations[0]));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(current, 3));
    const colours = new Float32Array(N * 3);
    geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    const material = new THREE.PointsMaterial({ size: 0.07, map: new THREE.CanvasTexture(dot), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true });
    const points = new THREE.Points(geometry, material);
    group.add(points);

    // ---------- Colours: teal machine, amber human (from the page theme) ----------
    const machine = new THREE.Color(), human = new THREE.Color(), tmpC = new THREE.Color();
    let dark = false;
    const readTheme = () => {
        const css = getComputedStyle(document.documentElement);
        machine.set(css.getPropertyValue('--machine').trim() || '#0f6b5c');
        human.set(css.getPropertyValue('--human').trim() || '#b5651d');
        const bg = new THREE.Color(css.getPropertyValue('--bg').trim() || '#f6f3ec');
        dark = bg.r + bg.g + bg.b < 1.2;
        material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        material.needsUpdate = true;
    };
    readTheme();
    new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', readTheme);

    // per-shape colour mix: share of human (amber) points
    const humanShare = { globe: 0.12, duo: 0.5, wave: 0.2, helix: 0.5, ring: 0.35, blocks: 0.15, knot: 0.3 };
    const humanMask = (name, i) => (name === 'duo' ? (i < N / 2 ? 1 : 0) : name === 'helix' ? i % 2 : ((i * 2654435761) % 1000) / 1000 < humanShare[name] ? 1 : 0);

    // where each shape sits: to the side on wide screens so it never sits under the text
    const layout = (name, wide) => ({
        globe: wide ? [3.5, 0.1, 0.88] : [0, 1.2, 0.8],
        duo: wide ? [0, 0, 0.9] : [0, 0, 0.62],
        wave: [0, -0.4, wide ? 1 : 0.7],
        helix: [0, 0, wide ? 1 : 0.66],
        ring: [0, 0, wide ? 1.05 : 0.7],
        blocks: wide ? [3.1, 0, 0.85] : [0, 0.6, 0.62],
        knot: wide ? [3, 0, 1] : [0, 0.6, 0.7],
    }[name]);
    const opacityFor = { globe: 1, duo: 0.5, wave: 0.55, helix: 0.5, ring: 0.45, blocks: 0.75, knot: 0.7 };

    // ---------- Scroll → which shape, and how far into the next ----------
    let wide = innerWidth > 900;
    function scrollState() {
        const mid = innerHeight * 0.5;
        let i = 0;
        for (let k = 0; k < sections.length; k++) if (sections[k].getBoundingClientRect().top <= mid) i = k;
        const box = sections[i].getBoundingClientRect();
        const local = Math.min(1, Math.max(0, (mid - box.top) / box.height));
        // hold the shape for most of the chapter, then morph into the next one near its end
        const blend = i < sections.length - 1 ? smooth(Math.min(1, Math.max(0, (local - 0.7) / 0.3))) : 0;
        return { i, blend };
    }
    const smooth = (t) => t * t * (3 - 2 * t);

    // ---------- Size ----------
    function resize() {
        wide = innerWidth > 900;
        renderer.setSize(innerWidth, innerHeight, false);
        camera.aspect = innerWidth / innerHeight;
        camera.position.z = camera.aspect < 0.8 ? 11 : 9;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    // ---------- Pointer parallax ----------
    const pointer = { x: 0, y: 0 };
    window.addEventListener('pointermove', (e) => {
        pointer.x = (e.clientX / innerWidth - 0.5);
        pointer.y = (e.clientY / innerHeight - 0.5);
    }, { passive: true });

    // ---------- Loop ----------
    const target = new Float32Array(N * 3);
    const pos = new THREE.Vector3();
    let last = performance.now(), time = 0, running = false;
    const groupPos = new THREE.Vector3(...layout(formations[0], wide).slice(0, 2), 0);
    let groupScale = layout(formations[0], wide)[2];
    let opacity = opacityFor[formations[0]];

    function frame(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        time += dt;
        const { i, blend } = scrollState();
        const a = formations[i], b = formations[Math.min(i + 1, formations.length - 1)];
        const pa = positionsFor(a), pb = positionsFor(b);
        const la = layout(a, wide), lb = layout(b, wide);

        // morph target, eased toward with a little inertia so every move feels physical
        const follow = still.matches ? 1 : 1 - Math.pow(0.0015, dt);
        for (let k = 0; k < N * 3; k++) {
            target[k] = pa[k] + (pb[k] - pa[k]) * blend;
            current[k] += (target[k] - current[k]) * follow;
        }
        // gentle life: the data wave ripples
        if (!still.matches && (a === 'wave' || b === 'wave')) {
            const w = a === 'wave' ? 1 - blend : blend;
            for (let k = 0; k < N; k++) current[k * 3 + 1] += Math.sin(time * 1.4 + current[k * 3] * 0.9 + current[k * 3 + 2]) * 0.004 * w;
        }
        geometry.attributes.position.needsUpdate = true;

        for (let k = 0; k < N; k++) {
            const h = humanMask(a, k) * (1 - blend) + humanMask(b, k) * blend;
            tmpC.copy(machine).lerp(human, h);
            colours[k * 3] = tmpC.r; colours[k * 3 + 1] = tmpC.g; colours[k * 3 + 2] = tmpC.b;
        }
        geometry.attributes.color.needsUpdate = true;

        const tx = la[0] + (lb[0] - la[0]) * blend, ty = la[1] + (lb[1] - la[1]) * blend;
        const ts = la[2] + (lb[2] - la[2]) * blend;
        groupPos.x += (tx - groupPos.x) * follow;
        groupPos.y += (ty - groupPos.y) * follow;
        groupScale += (ts - groupScale) * follow;
        group.position.copy(groupPos);
        group.scale.setScalar(groupScale);
        const to = (opacityFor[a] + (opacityFor[b] - opacityFor[a]) * blend) * (dark ? 0.9 : 0.75);
        opacity += (to - opacity) * follow;
        material.opacity = opacity;

        const spin = still.matches ? 0 : time * 0.08;
        group.rotation.y = spin + pointer.x * 0.5;
        group.rotation.x = 0.18 + pointer.y * 0.3;
        renderer.render(scene, camera);

        if (running) requestAnimationFrame(frame);
    }

    const update = () => {
        const should = !document.hidden;
        if (should && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
        if (!should) running = false;
    };
    document.addEventListener('visibilitychange', update);
    update();
    canvas.classList.add('ready');
}

if (canvas) {
    try { start(); } catch (error) { canvas.remove(); }
}
