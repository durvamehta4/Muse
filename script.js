(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

  /* ---------- nav: scrolled state, progress bar ---------- */
  const nav = $('.nav');
  const bar = $('.progress span');
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', scrollY > 4);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- dropdowns + theme menu ---------- */
  const closeAll = (except) => {
    $$('.dd, .theme').forEach((el) => {
      if (el === except) return;
      el.classList.remove('is-open');
      el.querySelector('button').setAttribute('aria-expanded', 'false');
    });
  };
  $$('.dd, .theme').forEach((el) => {
    const btn = el.querySelector('button');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !el.classList.contains('is-open');
      closeAll(el);
      el.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', () => closeAll());
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeAll());

  const setTheme = (t) => {
    if (t === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    $$('[data-set-theme]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.setTheme === t)));
  };
  let stored = 'system';
  try { stored = localStorage.getItem('theme') || 'system'; } catch (e) {}
  $$('[data-set-theme]').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.setTheme === stored));
    b.addEventListener('click', () => setTheme(b.dataset.setTheme));
  });

  const burger = $('.burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-menu');
    burger.setAttribute('aria-expanded', String(open));
  });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      en.target.dispatchEvent(new CustomEvent('reveal'));
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 60}ms`;
    io.observe(el);
  });

  /* ---------- toc scrollspy ---------- */
  const tocLinks = $$('.toc a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      tocLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('.section').forEach((s) => spy.observe(s));

  /* ---------- counters ---------- */
  $$('[data-count]').forEach((el) => {
    el.closest('.reveal').addEventListener('reveal', () => {
      const target = parseFloat(el.dataset.count);
      const dec = +(el.dataset.dec || 0);
      const suf = el.dataset.suffix || '';
      const dur = reduce ? 1 : 1600;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 4);
        el.textContent = (target * e).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { once: true });
  });

  /* ---------- scaling chart points ---------- */
  const pts = $('.scaling .pts');
  if (pts) {
    const P = [[60, 60], [130, 100], [200, 132], [270, 158], [340, 178], [410, 196], [480, 210], [550, 224], [620, 236]];
    P.forEach(([x, y], i) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y + (i % 2 ? 3 : -3)); c.setAttribute('r', 4.5);
      c.style.transitionDelay = `${0.2 + i * 0.12}s`;
      pts.appendChild(c);
    });
  }

  /* ---------- benchmark chart tabs ---------- */
  const DATA = {
    reason: [['Graduate science QA', 'multiple choice', [88.4, 84.1, 79.3]], ['Competition math', 'pass@1', [93.7, 90.2, 85.6]], ['Hard puzzles', 'accuracy', [41.2, 35.8, 28.4]], ['Multilingual QA', 'accuracy', [91.0, 89.4, 87.1]]],
    code: [['Repo-level bug fixing', 'resolved %', [78.2, 74.5, 69.0]], ['Terminal tasks', 'success %', [61.4, 55.0, 47.9]], ['Live coding contests', 'pass@1', [72.8, 68.3, 60.2]], ['Code review', 'F1', [66.5, 61.9, 58.7]]],
    agent: [['Web browsing', 'success %', [70.3, 63.1, 55.4]], ['Computer use', 'success %', [58.9, 52.6, 44.0]], ['Tool calling', 'accuracy', [86.1, 83.7, 80.2]], ['Long-horizon tasks', 'completion %', [49.7, 42.3, 35.1]]],
  };
  const barsEl = $('[data-bars]');
  const renderBars = (key) => {
    barsEl.classList.remove('is-drawn');
    barsEl.innerHTML = DATA[key].map(([name, metric, vals], r) => `
      <div class="bar-row">
        <div class="bar-row__name">${name}<small>${metric}</small></div>
        <div class="bar-group">
          ${vals.map((v, j) => `<div class="bar bar--${'abc'[j]}" style="--w:${v * 0.85}%;--d:${r * 0.08 + j * 0.06}s"><i></i><b>${v.toFixed(1)}</b></div>`).join('')}
        </div>
      </div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => barsEl.classList.add('is-drawn')));
  };
  const seg = $('.seg');
  const pill = $('.seg__pill');
  const movePill = (btn) => {
    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.transform = `translateX(${btn.offsetLeft}px)`;
  };
  $$('button', seg).forEach((b) => b.addEventListener('click', () => {
    $$('button', seg).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    movePill(b);
    renderBars(b.dataset.tab);
  }));
  addEventListener('resize', () => movePill($('[aria-selected="true"]', seg)));
  document.fonts?.ready.then(() => movePill($('[aria-selected="true"]', seg)));
  movePill($('[aria-selected="true"]', seg));
  $('.chart-tabs').addEventListener('reveal', () => renderBars('reason'), { once: true });

  /* ---------- demo carousels ---------- */
  const DEMOS = {
    demo1: [
      {
        tab: 'Flaky test fix', eyebrow: 'Coding · Debugging',
        title: 'Track down a race condition',
        body: 'Aurora reproduces an intermittent failure, finds the shared state behind it and ships a minimal patch with a regression test.',
        prompt: 'The checkout test fails about 1 in 20 runs on CI. Find out why and fix it.',
        kind: 'term',
        lines: [
          ['c-p', '$ npm test -- checkout --repeat 50'],
          ['c-dim', '  running 50 iterations…'],
          ['c-r', '  ✗ 3 / 50 failed: expected cart.total 42.00, got 0.00'],
          ['', ''],
          ['c-y', '● Reading src/cart/store.ts'],
          ['c-dim', '  shared singleton `cache` is reset in afterEach, but async flush runs later'],
          ['c-y', '● Editing src/cart/store.ts'],
          ['c-ok', '  + await store.flush()  // drain pending writes before reset'],
          ['c-y', '● Adding test: "total survives concurrent flush"'],
          ['', ''],
          ['c-p', '$ npm test -- checkout --repeat 200'],
          ['c-ok', '  ✓ 200 / 200 passed (14.2s)'],
        ],
      },
      {
        tab: 'Weather widget', eyebrow: 'Coding · Front end',
        title: 'Build a small UI from a sketch',
        body: 'Given a rough description, the model scaffolds a component, wires the data, and checks it at mobile width.',
        prompt: 'Make a compact weather card: city, temperature, 5-day strip, dark mode.',
        kind: 'term',
        lines: [
          ['c-y', '● Creating src/components/WeatherCard.tsx'],
          ['c-ok', '  + export function WeatherCard({ city, days }: Props) {'],
          ['c-ok', '  +   const avg = mean(days.map(d => d.temp))'],
          ['c-y', '● Creating src/components/WeatherCard.css'],
          ['c-ok', '  + @media (prefers-color-scheme: dark) { … }'],
          ['c-p', '$ npx playwright screenshot --viewport 375x812'],
          ['c-ok', '  ✓ no horizontal overflow · contrast 7.1:1'],
          ['c-p', '$ npm run typecheck'],
          ['c-ok', '  ✓ 0 errors'],
        ],
      },
      {
        tab: 'API refactor', eyebrow: 'Coding · Large changes',
        title: 'Refactor across 40 files',
        body: 'Aurora migrates a callback-based client to async/await, keeping every call site and test green.',
        prompt: 'Migrate our HTTP client to async/await. Do not change public behavior.',
        kind: 'term',
        lines: [
          ['c-p', '$ rg "client\\.request\\(" -c | wc -l'],
          ['c-dim', '  41'],
          ['c-y', '● Planning: 1) new async core  2) shim old API  3) migrate callers  4) drop shim'],
          ['c-y', '● Editing 41 files'],
          ['c-ok', '  ████████████████████ 41/41'],
          ['c-p', '$ npm test'],
          ['c-ok', '  ✓ 1,284 passed · 0 failed'],
          ['c-dim', '  diff: +612 −798'],
        ],
      },
    ],
    demo2: [
      {
        tab: 'Weekend trip', eyebrow: 'Everyday · Planning',
        title: 'Plan around real constraints',
        body: 'Aurora remembers your preferences from earlier in the conversation and builds a plan that respects them.',
        prompt: 'Two days in the mountains, no car, I hate early mornings.',
        kind: 'chat',
        turns: [
          ['u', 'Two days in the mountains, no car, I hate early mornings.'],
          ['a', 'Here\'s a plan that never starts before 10:00:<ul><li><b>Sat</b> 10:30 train → valley town, lunch, gondola to ridge trail (2 h loop)</li><li><b>Sun</b> slow breakfast, lake walk, 15:10 train home</li></ul>'],
          ['u', 'Can you swap the ridge for something flatter?'],
          ['a', 'Sure. I swapped in the lakeside path: 6 km, 80 m of climbing, and it connects to the same gondola station.'],
        ],
      },
      {
        tab: 'Gift ideas', eyebrow: 'Everyday · Personalization',
        title: 'Ideas that fit the person',
        body: 'Instead of generic lists, the model asks one sharp question, then tailors its suggestions.',
        prompt: 'Gift for my sister, around $50.',
        kind: 'chat',
        turns: [
          ['u', 'Gift for my sister, around $50.'],
          ['a', 'Quick question so this isn\'t generic: what does she do on a free Sunday?'],
          ['u', 'Pottery class, then a long walk with her dog.'],
          ['a', 'Three ideas:<ul><li>A glaze sampler set ($42)</li><li>A hands-free dog leash with a pouch ($38)</li><li>A day pass to an open studio ($50)</li></ul>'],
        ],
      },
      {
        tab: 'Seating chart', eyebrow: 'Everyday · Reasoning',
        title: 'Solve a small constraint puzzle',
        body: 'Aurora satisfies hard constraints, explains the trade-offs, and shows its work in a table.',
        prompt: 'Seat 8 guests at 2 tables. Ana and Ben apart; Cy next to Dee.',
        kind: 'chat',
        turns: [
          ['u', 'Seat 8 guests at 2 tables. Ana and Ben apart; Cy next to Dee.'],
          ['a', 'Here\'s one arrangement that satisfies every constraint:<table><tr><th>Table 1</th><th>Table 2</th></tr><tr><td>Ana</td><td>Ben</td></tr><tr><td>Cy</td><td>Eve</td></tr><tr><td>Dee</td><td>Fay</td></tr><tr><td>Gus</td><td>Hal</td></tr></table>'],
        ],
      },
    ],
  };

  const AUTO_MS = 9000;
  $$('[data-carousel]').forEach((root) => {
    const items = DEMOS[root.dataset.carousel];
    let idx = 0, token = 0, timer = null, tabAnim = null, started = false;

    root.innerHTML = `
      <div class="car__tabs" role="tablist">${items.map((it, i) => `<button class="car__tab" role="tab" aria-selected="${i === 0}">${it.tab}<span class="tbar"></span></button>`).join('')}</div>
      <div class="car__card"><div class="car__copy"></div><div class="car__out"></div></div>`;
    const tabs = $$('.car__tab', root);
    const copy = $('.car__copy', root);
    const out = $('.car__out', root);

    const runTerm = async (it, my) => {
      out.innerHTML = '<div class="glimmer">Loading demo…</div><div class="term"><div class="term__chrome"><i></i><i></i><i></i></div></div>';
      await wait(900);
      if (my !== token) return;
      $('.glimmer', out).classList.add('is-done');
      const term = $('.term', out);
      const cur = document.createElement('span'); cur.className = 'cursor';
      for (const [cls, text] of it.lines) {
        const line = document.createElement('div');
        line.className = `term__line ${cls}`;
        term.appendChild(line);
        line.appendChild(cur);
        const typed = text.startsWith('$');
        if (typed) {
          for (let i = 0; i < text.length; i++) {
            if (my !== token) return;
            line.insertBefore(document.createTextNode(text[i]), cur);
            await wait(22);
          }
          await wait(250);
        } else {
          line.insertBefore(document.createTextNode(text), cur);
          await wait(text ? 160 : 60);
        }
        if (my !== token) return;
        term.scrollTop = term.scrollHeight;
      }
    };

    const runChat = async (it, my) => {
      out.innerHTML = '<div class="glimmer">Loading demo…</div><div class="chat"></div>';
      await wait(700);
      if (my !== token) return;
      $('.glimmer', out).classList.add('is-done');
      const chat = $('.chat', out);
      for (const [who, html] of it.turns) {
        if (who === 'a') {
          const t = document.createElement('div');
          t.className = 'turn turn--a';
          t.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
          chat.appendChild(t);
          await wait(900);
          if (my !== token) return;
          t.innerHTML = html;
          t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
        } else {
          const t = document.createElement('div');
          t.className = 'turn turn--u';
          t.textContent = html;
          chat.appendChild(t);
        }
        chat.scrollTop = chat.scrollHeight;
        await wait(700);
        if (my !== token) return;
      }
    };

    const show = (i, user = false) => {
      idx = i;
      const my = ++token;
      const it = items[i];
      tabs.forEach((t, j) => t.setAttribute('aria-selected', String(j === i)));
      copy.innerHTML = `<div class="car__swap"><div class="car__eyebrow">${it.eyebrow}</div><h4 class="car__title">${it.tab === it.title ? it.tab : it.title}</h4><p class="car__body">${it.body}</p></div>
        <div class="car__prompt car__swap" style="animation-delay:.08s"><small>Prompt</small>${it.prompt}</div>`;
      (it.kind === 'term' ? runTerm : runChat)(it, my);

      clearTimeout(timer);
      tabAnim?.cancel();
      tabs.forEach((t) => ($('.tbar', t).style.transform = 'scaleX(0)'));
      if (user || reduce) return; // stop auto-advance once the user picks
      tabAnim = $('.tbar', tabs[i]).animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: AUTO_MS, easing: 'linear', fill: 'forwards' });
      timer = setTimeout(() => show((i + 1) % items.length), AUTO_MS);
    };
    let userPicked = false;
    tabs.forEach((t, i) => t.addEventListener('click', () => { userPicked = true; show(i, true); }));
    root.addEventListener('reveal', () => { if (!started) { started = true; show(0, userPicked); } });
  });

  /* ---------- hero "video" player (canvas animation) ---------- */
  const player = $('[data-player]');
  const cv = $('.player__canvas', player);
  const ctx = cv.getContext('2d');
  const DURATION = 48;
  const CAPTIONS = [
    [0, 'This is Aurora.'],
    [5, 'A new family of models built on a rebuilt research stack.'],
    [12, 'Trained to reason, to code, and to act over long tasks.'],
    [21, 'Designed so what it learns carries over to new problems.'],
    [31, 'Tested for safety before it reaches anyone.'],
    [40, 'Available today.'],
  ];
  let t = 0, playing = false, last = 0;
  const capEl = $('.player__caption', player);
  const fill = $('.pb__fill', player), knob = $('.pb__knob', player), scrub = $('.pb__scrub', player);
  const timeEl = $('.pb__time', player);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  let ccOn = true;

  const sizeCanvas = (c) => {
    const r = c.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = Math.max(1, r.width * dpr); c.height = Math.max(1, r.height * dpr);
  };

  // flowing aurora ribbons
  const drawAurora = (c, g, time, intensity = 1) => {
    const w = c.width, h = c.height;
    g.fillStyle = '#050608'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    const hues = [[8, 102, 255], [155, 92, 255], [0, 210, 200], [255, 90, 170]];
    for (let k = 0; k < 4; k++) {
      const [r, gg, b] = hues[k];
      g.beginPath();
      const yBase = h * (0.35 + k * 0.1);
      for (let x = 0; x <= w; x += w / 80) {
        const nx = x / w;
        const y = yBase + Math.sin(nx * 6 + time * (0.5 + k * 0.17) + k) * h * 0.08 + Math.sin(nx * 13 - time * 0.9 + k * 2) * h * 0.03;
        x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.lineTo(w, h); g.lineTo(0, h); g.closePath();
      const grad = g.createLinearGradient(0, yBase - h * 0.15, 0, yBase + h * 0.35);
      grad.addColorStop(0, `rgba(${r},${gg},${b},${0.42 * intensity})`);
      grad.addColorStop(0.35, `rgba(${r},${gg},${b},${0.08 * intensity})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad; g.fill();
    }
    // stars
    for (let i = 0; i < 90; i++) {
      const sx = ((i * 9301 + 49297) % 233280) / 233280 * w;
      const sy = ((i * 4271 + 1237) % 1000) / 1000 * h * 0.55;
      const a = 0.25 + 0.5 * Math.abs(Math.sin(time * 1.3 + i));
      g.fillStyle = `rgba(255,255,255,${a * 0.6})`;
      g.fillRect(sx, sy, 1.5, 1.5);
    }
    g.globalCompositeOperation = 'source-over';
  };

  const drawPlayer = () => {
    drawAurora(cv, ctx, t * 0.8 + 2);
    const w = cv.width, h = cv.height;
    // title fade card
    const card = CAPTIONS.findLast((c) => t >= c[0]);
    const seg = card ? t - card[0] : 0;
    const a = Math.min(1, seg / 0.8);
    ctx.fillStyle = `rgba(255,255,255,${0.92 * a})`;
    ctx.font = `600 ${Math.round(h * 0.085)}px "Inter Tight", Inter, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (t < 4.5) ctx.fillText('Aurora', w / 2, h * 0.45 - (1 - a) * 20);
    if (t > 40) ctx.fillText('Available today', w / 2, h * 0.45 - (1 - a) * 20);
  };

  const setCaption = () => {
    const c = CAPTIONS.findLast((x) => t >= x[0]);
    const txt = c ? c[1] : '';
    if (capEl.textContent !== txt) capEl.textContent = txt;
    capEl.classList.toggle('is-on', ccOn && (playing || t > 0) && !!txt);
  };
  const setProgress = () => {
    const p = (t / DURATION) * 100;
    fill.style.width = `${p}%`; knob.style.left = `${p}%`;
    scrub.setAttribute('aria-valuenow', Math.round(p));
    timeEl.textContent = fmt(t);
  };
  const loop = (now) => {
    if (playing) {
      t += (now - last) / 1000;
      if (t >= DURATION) { t = DURATION; setPlaying(false); }
    }
    last = now;
    drawPlayer(); setCaption(); setProgress();
    requestAnimationFrame(loop);
  };
  const setPlaying = (v) => {
    if (v && t >= DURATION) t = 0;
    playing = v;
    player.classList.toggle('is-playing', v);
  };
  $('.player__big', player).addEventListener('click', () => setPlaying(true));
  $('.pb--play', player).addEventListener('click', () => setPlaying(!playing));
  cv.addEventListener('click', () => setPlaying(!playing));
  $('.pb--mute', player).addEventListener('click', () => player.classList.toggle('is-muted'));
  $('.pb--cc', player).addEventListener('click', (e) => { ccOn = !ccOn; e.currentTarget.classList.toggle('is-on', ccOn); });
  const seek = (clientX) => {
    const r = scrub.getBoundingClientRect();
    t = Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * DURATION;
  };
  scrub.addEventListener('pointerdown', (e) => {
    seek(e.clientX); scrub.setPointerCapture(e.pointerId);
    const move = (ev) => seek(ev.clientX);
    scrub.addEventListener('pointermove', move);
    scrub.addEventListener('pointerup', () => scrub.removeEventListener('pointermove', move), { once: true });
  });
  scrub.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') t = Math.min(DURATION, t + 5);
    if (e.key === 'ArrowLeft') t = Math.max(0, t - 5);
  });
  sizeCanvas(cv);
  requestAnimationFrame((n) => { last = n; loop(n); });

  /* ---------- closing canvas ---------- */
  const closing = $('.closing');
  const cc = $('.closing__canvas');
  const cctx = cc.getContext('2d');
  let ct = 0, visible = false;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(closing);
  sizeCanvas(cc);
  const cloop = () => {
    if (visible) { ct += reduce ? 0 : 0.012; drawAurora(cc, cctx, ct, 0.9); }
    requestAnimationFrame(cloop);
  };
  cloop();

  addEventListener('resize', () => { sizeCanvas(cv); sizeCanvas(cc); });
})();
