(() => {
    const root = document.documentElement;
    root.classList.add('js');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const $ = (sel, el = document) => el.querySelector(sel);
    const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    // Small message at the bottom of the screen
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.append(toast);
    let toastTimer;
    const say = (text) => {
        toast.textContent = text;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    };

    /* ---------- Theme ---------- */
    const toggle = $('#themeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const theme = () => root.dataset.theme || (prefersDark.matches ? 'dark' : 'light');
    const label = () => toggle.setAttribute('aria-label', theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    toggle.addEventListener('click', () => {
        const next = theme() === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) {}
        label();
    });
    prefersDark.addEventListener?.('change', label);
    label();

    /* ---------- Dock: active chapter + reading progress ---------- */
    const chapters = $$('.chapter');
    const dockLinks = new Map($$('.dock a').map((a) => [a.dataset.dock, a]));
    const progress = $('#dockProgress');
    const onScroll = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
        const mid = innerHeight * 0.45;
        let current = chapters[0];
        for (const c of chapters) if (c.getBoundingClientRect().top <= mid) current = c;
        dockLinks.forEach((a, id) => a.classList.toggle('active', id === current.id));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    /* ---------- 3D entrances ---------- */
    const revealer = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealer.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    $$('.reveal3d').forEach((el) => revealer.observe(el));

    /* ---------- Chapter 2: story animations ---------- */
    const animations = {
        // 30+ days counting down to 1–2 hours
        async time(card, run) {
            const num = $('[data-time-num]', card);
            const unit = $('[data-time-unit]', card);
            const box = $('.time-anim', card);
            const before = $('[data-time-before]', card);
            const after = $('[data-time-after]', card);
            box.classList.remove('done');
            num.textContent = '30+'; unit.textContent = 'days';
            before.style.width = '0'; after.style.width = '0';
            if (still.matches) {
                before.style.width = '100%'; after.style.width = '1.5%';
                num.textContent = '1–2'; unit.textContent = 'hours'; box.classList.add('done');
                return;
            }
            await sleep(200);
            before.style.width = '100%';
            await sleep(900);
            const start = performance.now();
            const dur = 1700;
            await new Promise((resolve) => {
                const step = (now) => {
                    if (!run.active) return resolve();
                    const t = Math.min(1, (now - start) / dur);
                    const days = Math.max(1, Math.round(30 - ease(t) * 29));
                    num.textContent = String(days);
                    unit.textContent = days === 1 ? 'day' : 'days';
                    t < 1 ? requestAnimationFrame(step) : resolve();
                };
                requestAnimationFrame(step);
            });
            if (!run.active) return;
            await sleep(250);
            num.textContent = '1–2'; unit.textContent = 'hours';
            box.classList.add('done');
            after.style.width = '1.5%';
        },

        // a fragile site growing stronger as ~500 tests pass
        async tests(card, run) {
            const browser = $('.browser', card);
            const count = $('[data-test-count]', card);
            const ringEl = $('[data-ring]', card);
            const log = $('[data-test-log]', card);
            const labelEl = $('[data-strength-label]', card);
            const C = 326.7;
            const levels = ['Fragile', 'Getting sturdier', 'Solid', 'Strong', 'Rock-solid · all tests passing'];
            const names = [
                'login asks for a one-time code', 'records save with every field', 'eligibility rules match the handbook',
                'monthly report totals add up', 'Word export keeps the layout', 'only admins can change settings',
                'idle users get signed out', 'audit log records every edit', 'search finds names with accents',
                'backup restores every table', 'two people editing never collide', 'PDF matches the printed form',
                'Excel export opens cleanly', 'old links redirect safely', 'dates stay in Manila time',
            ];
            const set = (n) => {
                count.textContent = String(n);
                ringEl.style.strokeDashoffset = String(C * (1 - n / 500));
                const level = n >= 500 ? 4 : Math.min(3, Math.floor(n / 125));
                browser.dataset.strength = String(level);
                labelEl.textContent = levels[level];
            };
            const add = (text, cls) => {
                const li = document.createElement('li');
                li.className = cls;
                li.textContent = text;
                log.append(li);
                while (log.children.length > 6) log.firstElementChild.remove();
            };
            log.replaceChildren();
            set(0);
            if (still.matches) { set(500); add('500 of 500 tests passing', 'ok'); return; }

            const failAt = [140, 330];
            const dur = 4200;
            const start = performance.now();
            let shown = 0;
            let nameIndex = 0;
            await new Promise((resolve) => {
                const step = async (now) => {
                    if (!run.active) return resolve();
                    const t = Math.min(1, (now - start) / dur);
                    const n = Math.round(ease(t) * 500);
                    set(n);
                    while (shown + 38 <= n) {
                        shown += 38;
                        add(names[nameIndex++ % names.length], 'ok');
                    }
                    if (failAt.length && n >= failAt[0]) {
                        const at = failAt.shift();
                        const name = at < 200 ? 'report handles an empty month' : 'export keeps special characters';
                        add(name, 'fail');
                        browser.classList.add('hit');
                        await sleep(420);
                        browser.classList.remove('hit');
                        add('fixed: ' + name, 'fixed');
                    }
                    t < 1 ? requestAnimationFrame(step) : resolve();
                };
                requestAnimationFrame(step);
            });
            if (run.active) { set(500); add('all 500 tests passing', 'ok'); }
        },

        // every month since January 2020
        async calendar(card, run) {
            const grid = $('[data-cal]', card);
            const countEl = $('[data-cal-count]', card);
            const yearsEl = $('[data-cal-years]', card);
            const now = new Date();
            const total = (now.getFullYear() - 2020) * 12 + now.getMonth() + 1;
            const years = Math.floor(total / 12);
            yearsEl.textContent = `${years}+`;
            if (!grid.childElementCount) {
                grid.append(document.createElement('span'));
                'JFMAMJJASOND'.split('').forEach((m) => { const h = document.createElement('span'); h.className = 'cal-head'; h.textContent = m; grid.append(h); });
                for (let y = 2020; y <= now.getFullYear(); y++) {
                    const yl = document.createElement('span'); yl.className = 'cal-year'; yl.textContent = String(y); grid.append(yl);
                    for (let m = 0; m < 12; m++) {
                        const c = document.createElement('span');
                        c.className = 'cal-cell';
                        const index = (y - 2020) * 12 + m;
                        if (index >= total) c.classList.add('future');
                        c.dataset.i = String(index);
                        grid.append(c);
                    }
                }
            }
            const cells = $$('.cal-cell:not(.future)', grid);
            cells.forEach((c) => c.classList.remove('on', 'now'));
            countEl.textContent = '0';
            if (still.matches) {
                cells.forEach((c) => c.classList.add('on'));
                cells[cells.length - 1].classList.add('now');
                countEl.textContent = String(total);
                return;
            }
            for (let i = 0; i < cells.length; i++) {
                if (!run.active) return;
                cells[i].classList.add('on');
                countEl.textContent = String(i + 1);
                await sleep(i < cells.length - 6 ? 26 : 90);
            }
            cells[cells.length - 1].classList.add('now');
        },

        // an auditorium filling up with 400 people
        async people(card, run) {
            const crowd = $('[data-crowd]', card);
            const countEl = $('[data-people-count]', card);
            if (!crowd.childElementCount) {
                const svgNS = 'http://www.w3.org/2000/svg';
                let placed = 0;
                for (let r = 0; placed < 400; r++) {
                    const seats = Math.min(18 + r, 400 - placed);
                    const radius = 64 + r * 19;
                    for (let s = 0; s < seats; s++) {
                        const a = (-56 + (112 * (s + 0.5)) / seats) * Math.PI / 180;
                        const use = document.createElementNS(svgNS, 'use');
                        use.setAttribute('href', '#person');
                        use.setAttribute('width', '10');
                        use.setAttribute('height', '16');
                        use.setAttribute('x', String((300 + Math.sin(a) * radius - 5).toFixed(1)));
                        use.setAttribute('y', String((20 + Math.cos(a) * radius - 8).toFixed(1)));
                        use.setAttribute('class', 'person' + ((placed * 7) % 5 === 0 ? ' alt' : ''));
                        crowd.append(use);
                        placed++;
                    }
                }
            }
            const people = $$('.person', crowd);
            people.forEach((p) => p.classList.remove('in'));
            countEl.textContent = '0';
            if (still.matches) { people.forEach((p) => p.classList.add('in')); countEl.textContent = '400'; return; }
            const perFrame = 6;
            for (let i = 0; i < people.length; i += perFrame) {
                if (!run.active) return;
                for (let j = i; j < Math.min(i + perFrame, people.length); j++) people[j].classList.add('in');
                countEl.textContent = String(Math.min(i + perFrame, people.length));
                await sleep(16);
            }
        },
    };

    const runs = new WeakMap();
    const play = (card) => {
        const previous = runs.get(card);
        if (previous) previous.active = false;
        const run = { active: true };
        runs.set(card, run);
        card.classList.remove('played');
        Promise.resolve(animations[card.dataset.anim](card, run)).finally(() => { if (run.active) card.classList.add('played'); });
    };
    const storyObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { play(e.target); storyObserver.unobserve(e.target); } });
    }, { threshold: 0.45 });
    $$('.story-card').forEach((card) => {
        storyObserver.observe(card);
        $('.replay', card).addEventListener('click', () => play(card));
    });

    /* ---------- Chapter 3: vertical or horizontal timeline ---------- */
    const shell = $('#timeline');
    const track = $('#timelineTrack');
    const viewButtons = $$('.view-toggle button');
    const prev = $('.tl-arrow.prev', shell);
    const next = $('.tl-arrow.next', shell);
    const updateArrows = () => {
        track.style.setProperty('--track-width', track.scrollWidth + 'px');
        prev.disabled = track.scrollLeft <= 4;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    const setView = (view, remember = true) => {
        shell.dataset.view = view;
        viewButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
        if (remember) { try { localStorage.setItem('timelineView', view); } catch (e) {} }
        $$('.stop', track).forEach((s) => s.classList.add('in'));
        requestAnimationFrame(updateArrows);
    };
    viewButtons.forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
    try { const saved = localStorage.getItem('timelineView'); if (saved === 'horizontal' || saved === 'vertical') setView(saved, false); } catch (e) {}
    const stepBy = (dir) => {
        const card = $('.stop', track);
        track.scrollBy({ left: dir * ((card?.offsetWidth || 320) + 20), behavior: still.matches ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => stepBy(-1));
    next.addEventListener('click', () => stepBy(1));
    track.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);

    /* ---------- Chapter 4: the quest map (road + traveller follow the scroll) ---------- */
    const quest = $('#quest');
    const roadSvg = $('.quest-road', quest);
    const roadBase = $('.road-base', quest);
    const roadLit = $('.road-lit', quest);
    const traveler = $('.traveler', quest);
    const qstops = $$('.qstop', quest);
    let roadLength = 0;
    let stopLengths = [];
    const buildRoad = () => {
        const box = quest.getBoundingClientRect();
        const narrow = innerWidth <= 720;
        roadSvg.setAttribute('width', String(box.width));
        roadSvg.setAttribute('height', String(box.height));
        roadSvg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
        roadSvg.style.width = box.width + 'px'; // the site-wide icon rule would otherwise shrink it to 20px
        roadSvg.style.height = box.height + 'px';
        const marks = qstops.map((stop) => {
            const r = $('.qmark', stop).getBoundingClientRect();
            return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
        });
        const loop = $('.loop-icon', quest).getBoundingClientRect();
        const pts = [{ x: marks[0].x, y: 0 }, ...marks, { x: loop.left + loop.width / 2 - box.left, y: loop.top + loop.height / 2 - box.top }];
        const amp = narrow ? 14 : Math.min(120, box.width * 0.11);
        let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i], dy = b.y - a.y, s = i % 2 ? 1 : -1;
            d += ` C ${(a.x + s * amp).toFixed(1)} ${(a.y + dy / 3).toFixed(1)}, ${(b.x + s * amp).toFixed(1)} ${(b.y - dy / 3).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
        }
        roadBase.setAttribute('d', d);
        roadLit.setAttribute('d', d);
        roadLength = roadBase.getTotalLength();
        roadLit.style.strokeDasharray = String(roadLength);
        // where along the road each stop sits
        stopLengths = marks.map(() => roadLength);
        let next = 0;
        for (let l = 0; l <= roadLength && next < marks.length; l += 4) {
            if (roadBase.getPointAtLength(l).y >= marks[next].y - 1) { stopLengths[next] = l; next++; }
        }
        moveTraveler();
    };
    const moveTraveler = () => {
        if (!roadLength) return;
        const box = quest.getBoundingClientRect();
        let p = (innerHeight * 0.55 - box.top) / box.height;
        if (still.matches) p = 1;
        p = Math.max(0, Math.min(1, p));
        const at = p * roadLength;
        const pt = roadBase.getPointAtLength(at);
        traveler.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`;
        traveler.style.opacity = p > 0 && p < 1 ? '1' : (p >= 1 ? '0.9' : '0');
        roadLit.style.strokeDashoffset = String(roadLength - at);
        qstops.forEach((stop, i) => stop.classList.toggle('reached', at >= stopLengths[i] - 6));
    };
    window.addEventListener('scroll', moveTraveler, { passive: true });
    new ResizeObserver(buildRoad).observe(quest);
    window.addEventListener('load', buildRoad);
    document.fonts?.ready.then(buildRoad);

    /* ---------- Chapter 6: living toolkit visuals (run only while on screen) ---------- */
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const viz = {
        // a code editor typing a short report script
        code(card) {
            const out = $('[data-code]', card);
            const lines = [
                [['// let the machine do the repetitive part', 'c']],
                [['$report', 'v'], [' = ', ''], ['Report', 'f'], ['::', ''], ['forMonth', 'f'], ['(', ''], ['$month', 'v'], [');', '']],
                [['$report', 'v'], ['->', ''], ['members', 'f'], ['()->', ''], ['eligible', 'f'], ['();', '']],
                [['return ', 'k'], ['$report', 'v'], ['->', ''], ['export', 'f'], ['(', ''], ["'docx'", 's'], [');', '']],
                [['// 30+ days → 1–2 hours', 'c']],
            ];
            const total = lines.reduce((n, l) => n + l.reduce((m, [t]) => m + t.length, 0) + 1, 0);
            const render = (count) => {
                let left = count, html = '';
                for (const line of lines) {
                    if (left <= 0) break;
                    for (const [text, cls] of line) {
                        if (left <= 0) break;
                        const part = text.slice(0, left);
                        left -= part.length;
                        html += cls ? `<span class="tok-${cls}">${esc(part)}</span>` : esc(part);
                    }
                    if (left > 0) { html += '\n'; left -= 1; }
                }
                out.innerHTML = html;
            };
            let typed = 0, wait = 0, timer = null;
            const tick = () => {
                if (wait > 0) { wait -= 1; } else if (typed < total) { typed += 1; render(typed); if (typed === total) wait = 60; } else { typed = 0; render(0); wait = 6; }
            };
            return {
                start() { if (still.matches) { render(total); return; } if (!timer) timer = setInterval(tick, 38); },
                stop() { clearInterval(timer); timer = null; },
            };
        },

        // a live mini dashboard: bars re-grow and a trend line redraws
        data(card) {
            const barsEl = $('[data-bars]', card);
            const trend = $('[data-trend]', card);
            const rowsEl = $('[data-rows]', card);
            const svgNS = 'http://www.w3.org/2000/svg';
            const n = 9, w = 22, gap = (300 - n * w) / (n - 1);
            const bars = Array.from({ length: n }, (_, i) => {
                const r = document.createElementNS(svgNS, 'rect');
                r.setAttribute('class', 'bar');
                r.setAttribute('x', String(i * (w + gap)));
                r.setAttribute('y', '10');
                r.setAttribute('width', String(w));
                r.setAttribute('height', '100');
                r.setAttribute('rx', '4');
                barsEl.append(r);
                return r;
            });
            let rows = 0, timer = null, counter = null;
            const shuffle = () => {
                let level = 0.35;
                const hs = bars.map(() => (level = Math.min(0.98, Math.max(0.18, level + (Math.random() - 0.35) * 0.3))));
                bars.forEach((b, i) => { b.style.transform = `scaleY(${hs[i].toFixed(2)})`; });
                trend.setAttribute('points', hs.map((h, i) => `${(i * (w + gap) + w / 2).toFixed(1)},${(110 - h * 100 - 8).toFixed(1)}`).join(' '));
                const len = 340;
                trend.style.transition = 'none';
                trend.style.strokeDasharray = String(len);
                trend.style.strokeDashoffset = String(len);
                requestAnimationFrame(() => { trend.style.transition = ''; trend.style.strokeDashoffset = '0'; });
            };
            return {
                start() {
                    shuffle();
                    if (still.matches) { rowsEl.textContent = '1,204'; return; }
                    if (!timer) timer = setInterval(shuffle, 2600);
                    if (!counter) counter = setInterval(() => { rows += Math.floor(Math.random() * 9) + 1; rowsEl.textContent = rows.toLocaleString('en-US'); }, 120);
                },
                stop() { clearInterval(timer); clearInterval(counter); timer = counter = null; },
            };
        },

        // a small LAN: packets move between computers and out to the internet; the firewall blocks bad ones
        net(card) {
            const svgNS = 'http://www.w3.org/2000/svg';
            const linksEl = $('[data-links]', card), nodesEl = $('[data-nodes]', card), packetsEl = $('[data-packets]', card);
            const nodes = {
                web: { x: 34, y: 20, label: 'Internet', glyph: 'M-6 2a4 4 0 0 1 1-7.8A5 5 0 0 1 4.5-5 3.6 3.6 0 0 1 5 2Z' },
                fw: { x: 150, y: 20, label: 'Firewall', fw: true, glyph: 'M-6-4h12M-6 0h12M-6 4h12M-2-4v4M2 0v4' },
                sw: { x: 150, y: 66, label: 'Switch', glyph: 'M-7-2h14M-7 2h14M-4-2v-2M0-2v-2M4-2v-2' },
                ap: { x: 262, y: 66, label: 'Wi-Fi', glyph: 'M-6-1a8 8 0 0 1 12 0M-3.5 1.5a4.4 4.4 0 0 1 7 0M0 4h.01' },
                p1: { x: 40, y: 112, label: 'PC', glyph: 'M-6-4h12v7h-12ZM-2 5h4' },
                p2: { x: 112, y: 112, label: 'PC', glyph: 'M-6-4h12v7h-12ZM-2 5h4' },
                p3: { x: 188, y: 112, label: 'PC', glyph: 'M-6-4h12v7h-12ZM-2 5h4' },
                p4: { x: 262, y: 112, label: 'Laptop', glyph: 'M-5-4h10v6h-10ZM-7 4h14' },
            };
            const links = [['web', 'fw'], ['fw', 'sw'], ['sw', 'ap'], ['sw', 'p1'], ['sw', 'p2'], ['sw', 'p3'], ['ap', 'p4']];
            links.forEach(([a, b]) => {
                const l = document.createElementNS(svgNS, 'line');
                l.setAttribute('class', 'link');
                l.setAttribute('x1', nodes[a].x); l.setAttribute('y1', nodes[a].y);
                l.setAttribute('x2', nodes[b].x); l.setAttribute('y2', nodes[b].y);
                linksEl.append(l);
            });
            Object.values(nodes).forEach((n) => {
                const g = document.createElementNS(svgNS, 'g');
                g.setAttribute('class', 'node' + (n.fw ? ' fw' : ''));
                g.setAttribute('transform', `translate(${n.x} ${n.y})`);
                g.innerHTML = `<rect x="-13" y="-9" width="26" height="18" rx="5"/><path class="glyph" d="${n.glyph}"/><text y="19">${n.label}</text>`;
                nodesEl.append(g);
            });
            const block = document.createElementNS(svgNS, 'circle');
            block.setAttribute('class', 'block');
            block.setAttribute('cx', nodes.fw.x - 16); block.setAttribute('cy', nodes.fw.y); block.setAttribute('r', '4');
            packetsEl.append(block);
            const routes = [['p1', 'sw', 'p3'], ['p2', 'sw', 'fw', 'web'], ['web', 'fw', 'sw', 'p2'], ['p4', 'ap', 'sw', 'p1'], ['p3', 'sw', 'ap', 'p4'], ['p1', 'sw', 'fw', 'web']];
            let packets = [], raf = null, last = 0, spawnIn = 0, spawned = 0;
            const spawn = () => {
                spawned += 1;
                const bad = spawned % 5 === 0;
                const route = bad ? ['web', 'fw'] : routes[Math.floor(Math.random() * routes.length)];
                const el = document.createElementNS(svgNS, 'circle');
                el.setAttribute('r', bad ? '3.6' : '3');
                el.setAttribute('class', 'packet' + (bad ? ' bad' : ''));
                packetsEl.append(el);
                packets.push({ el, route, seg: 0, t: 0, bad });
            };
            const step = (now) => {
                const dt = Math.min(0.05, (now - last) / 1000);
                last = now;
                spawnIn -= dt;
                if (spawnIn <= 0) { spawn(); spawnIn = 0.45 + Math.random() * 0.5; }
                packets = packets.filter((p) => {
                    const a = nodes[p.route[p.seg]], b = nodes[p.route[p.seg + 1]];
                    p.t += dt * 1.6;
                    const stopAt = p.bad ? 0.82 : 1;
                    if (p.t >= stopAt) {
                        if (p.bad) { p.el.remove(); block.classList.remove('show'); void block.getBBox(); block.classList.add('show'); return false; }
                        p.seg += 1; p.t = 0;
                        if (p.seg >= p.route.length - 1) { p.el.remove(); return false; }
                    }
                    const a2 = nodes[p.route[p.seg]], b2 = nodes[p.route[p.seg + 1]];
                    p.el.setAttribute('cx', (a2.x + (b2.x - a2.x) * p.t).toFixed(1));
                    p.el.setAttribute('cy', (a2.y + (b2.y - a2.y) * p.t).toFixed(1));
                    return true;
                });
                raf = requestAnimationFrame(step);
            };
            return {
                start() { if (still.matches || raf) return; last = performance.now(); raf = requestAnimationFrame(step); },
                stop() { cancelAnimationFrame(raf); raf = null; },
            };
        },

        // a running broadcast timecode (the meters and playhead are CSS)
        av(card) {
            const tc = $('[data-tc]', card);
            let frames = 12 * 60 * 30 + 34 * 30, timer = null;
            const pad = (n) => String(n).padStart(2, '0');
            const show = () => {
                const s = Math.floor(frames / 30);
                tc.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(frames % 30)}`;
            };
            return {
                start() { show(); if (still.matches || timer) return; timer = setInterval(() => { frames += 1; show(); }, 1000 / 30); },
                stop() { clearInterval(timer); timer = null; },
            };
        },
        edu() { return { start() {}, stop() {} }; },
        certs() { return { start() {}, stop() {} }; },
        award() { return { start() {}, stop() {} }; },
    };
    const vizCards = $$('[data-viz]');
    const vizRuns = new Map(vizCards.map((card) => [card, viz[card.dataset.viz](card)]));
    const vizObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            const run = vizRuns.get(e.target);
            if (e.isIntersecting) {
                e.target.classList.add('playing', 'done');
                run.start();
            } else {
                e.target.classList.remove('playing');
                run.stop();
            }
        });
    }, { threshold: 0.3 });
    vizCards.forEach((card) => vizObserver.observe(card));

    /* ---------- Bonus: "More stack" deep dive ---------- */
    const nerdToggle = $('#nerdToggle');
    const nerdPanel = $('#nerdPanel');
    $$('.nerd-card', nerdPanel).forEach((card, i) => card.style.setProperty('--i', String(i)));
    nerdToggle.addEventListener('click', () => {
        const open = nerdToggle.getAttribute('aria-expanded') !== 'true';
        nerdToggle.setAttribute('aria-expanded', String(open));
        nerdPanel.hidden = !open;
        nerdPanel.classList.toggle('open', open);
        if (open) nerdToggle.scrollIntoView({ behavior: still.matches ? 'auto' : 'smooth', block: 'start' });
    });

    /* ---------- 3D tilt + light glare on cards (mouse only) ---------- */
    // Hovering a card also tells the particle field behind the page (scene.js) where it is,
    // so the 3D background leans toward it; a click sends a ripple through the particles.
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const tell = (type, detail) => window.dispatchEvent(new CustomEvent(type, { detail }));
    $$('.story-card').forEach((card) => card.classList.add('tilt'));
    $$('.tilt').forEach((card) => {
        const centre = () => {
            const box = card.getBoundingClientRect();
            return { x: (box.left + box.width / 2) / innerWidth - 0.5, y: (box.top + box.height / 2) / innerHeight - 0.5 };
        };
        card.addEventListener('pointerenter', () => {
            if (!fine.matches || still.matches) return;
            tell('card3d', { on: true, ...centre() });
        });
        card.addEventListener('pointermove', (event) => {
            if (!fine.matches || still.matches || !card.classList.contains('in')) return;
            const box = card.getBoundingClientRect();
            const x = (event.clientX - box.left) / box.width - 0.5;
            const y = (event.clientY - box.top) / box.height - 0.5;
            const k = Math.min(1, 520 / box.width); // big cards tilt less
            card.style.transform = `perspective(900px) rotateX(${(-y * 11 * k).toFixed(2)}deg) rotateY(${(x * 13 * k).toFixed(2)}deg) translateZ(14px) translateY(-4px)`;
            card.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
            card.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
            card.classList.add('glare');
        });
        card.addEventListener('pointerleave', () => {
            card.style.transform = '';
            card.classList.remove('glare');
            tell('card3d', { on: false });
        });
        card.addEventListener('pointerdown', () => { if (!still.matches) tell('pulse3d', centre()); });
    });

    /* ---------- Scroll depth: cards and titles turn in 3D as they travel through the screen ---------- */
    const depthEls = $$('.chapter-title, .story-card, .project, .stop, .skill-group, .cred, .duo-card');
    depthEls.forEach((el) => { el.dataset.depth = ''; });
    let depthQueued = false;
    const depth = () => {
        depthQueued = false;
        if (still.matches) return;
        const vh = innerHeight;
        depthEls.forEach((el) => {
            const box = el.getBoundingClientRect();
            if (box.bottom < -80 || box.top > vh + 80) return;
            // -1 when the element is high on the screen, 0 at the centre, 1 low on the screen
            const p = Math.max(-1, Math.min(1, (box.top + Math.min(box.height, vh) / 2 - vh / 2) / (vh / 2)));
            const amt = el.classList.contains('chapter-title') ? 16 : 9;
            el.style.rotate = `1 0 0 ${(p * amt).toFixed(2)}deg`;
            el.style.translate = `0 0 ${(-p * p * 80).toFixed(1)}px`;
        });
    };
    const queueDepth = () => { if (!depthQueued) { depthQueued = true; requestAnimationFrame(depth); } };
    window.addEventListener('scroll', queueDepth, { passive: true });
    window.addEventListener('resize', queueDepth);
    queueDepth();

    /* ---------- Contact ---------- */
    const copy = $('#copyEmail');
    copy.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(copy.dataset.email);
            say('Email address copied');
        } catch (e) {
            window.location.href = 'mailto:' + copy.dataset.email;
        }
    });

    // Résumé: only download when the PDF really exists; otherwise explain instead of saving an error page.
    $$('a[href$="resume.pdf"]').forEach((link) => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                const res = await fetch(link.getAttribute('href'), { method: 'HEAD', cache: 'no-store' });
                const type = res.headers.get('content-type') || '';
                if (!res.ok || !type.includes('pdf')) throw new Error('missing');
                const a = document.createElement('a');
                a.href = link.getAttribute('href');
                a.download = 'Charles-Andrei-Galvan-Resume.pdf';
                document.body.append(a);
                a.click();
                a.remove();
            } catch (e) {
                say('The résumé PDF is coming soon. Please email me for a copy.');
            }
        });
    });

    $('#year').textContent = String(new Date().getFullYear());
})();
