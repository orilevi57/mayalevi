  const tones = [
    { id: 'linen', c: '#F8F6F2' },
    { id: 'sand',  c: '#D9CDB8' },
    { id: 'stone', c: '#A79F8C' },
    { id: 'umber', c: '#464136' },
    { id: 'wine', c: '#4E0A1D' }
  ];
  const svg = document.getElementById('flower');
  const NS = 'http://www.w3.org/2000/svg';
  const C = 50, D = 25, R = 20;
  // each petal = its circle clipped to a 60° wedge, so the outer outline reads as one flower
  tones.forEach((t, i) => {
    const step = 360 / tones.length;
    const a = (-90 + i * step) * Math.PI / 180;
    const px = C + D * Math.cos(a), py = C + D * Math.sin(a);
    const half = step / 2 * Math.PI / 180;
    const w1 = a - half, w2 = a + half, far = 80;
    const clip = document.createElementNS(NS, 'clipPath');
    clip.id = 'w' + i;
    const poly = document.createElementNS(NS, 'path');
    poly.setAttribute('d', `M${C} ${C}L${C + far * Math.cos(w1)} ${C + far * Math.sin(w1)}L${C + far * Math.cos(w2)} ${C + far * Math.sin(w2)}Z`);
    clip.appendChild(poly); svg.appendChild(clip);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'petal'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
    g.setAttribute('aria-label', t.id); g.dataset.tone = t.id; g.style.setProperty('--c', t.c);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('clip-path', `url(#w${i})`);
    p.setAttribute('d', `M${px - R} ${py}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z`);
    g.appendChild(p); svg.appendChild(g);
  });
  const core = document.createElementNS(NS, 'circle');
  core.setAttribute('class', 'core'); core.setAttribute('cx', C); core.setAttribute('cy', C); core.setAttribute('r', 13);
  svg.appendChild(core);

  const petals = svg.querySelectorAll('.petal');
  let turns = 0;
  function setTone(t, spin) {
    if (t === 'linen') document.documentElement.removeAttribute('data-tone');
    else document.documentElement.setAttribute('data-tone', t);
    petals.forEach(p => p.setAttribute('aria-pressed', p.dataset.tone === t));
    if (spin) { turns += 360 / tones.length; svg.style.transform = `rotate(${turns}deg)`; }
    try { localStorage.setItem('tone', t); } catch (e) {}
  }
  let saved = 'linen';
  try { saved = localStorage.getItem('tone') || 'linen'; } catch (e) {}
  if (!tones.some(t => t.id === saved)) saved = 'linen';
  setTone(saved, false);
  petals.forEach(p => {
    p.addEventListener('click', () => setTone(p.dataset.tone, true));
    p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTone(p.dataset.tone, true); } });
  });
  /* ---------- Hover-play video ---------- */
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.querySelectorAll('.project').forEach(card => {
    const v = card.querySelector('video');
    if (!v) return;
    v.muted = true;
    if (fine) {
      card.addEventListener('mouseenter', () => { v.play().catch(() => {}); });
      card.addEventListener('mouseleave', () => { v.pause(); });
    }
  });
  // touch screens: play whatever is on screen
  if (!fine && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target.querySelector('video'); if (!v) return;
      e.isIntersecting ? v.play().catch(() => {}) : v.pause();
    }), { threshold: .6 });
    document.querySelectorAll('.project').forEach(c => io.observe(c));
  }

  /* ---------- Page transitions ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a || reduce || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || /^(mailto|tel):/.test(href)) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = url.href; }, 380);
  });
  addEventListener('pageshow', () => document.body.classList.remove('leaving'));

  /* ---------- Custom cursor ---------- */
  if (fine && !reduce) {
    const cur = document.querySelector('.cursor');
    const txt = cur.querySelector('span');
    document.documentElement.classList.add('custom-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; cur.classList.add('on'); });
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
    (function loop() {
      cx += (x - cx) * .22; cy += (y - cy) * .22;
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    })();
    // a random shape from the logo on every project hover (never the same twice in a row)
    const shapes = [...cur.querySelectorAll('.cursor-shape')];
    let shapeIx = -1, lastLab = null;
    document.addEventListener('mouseover', e => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, [role="button"]');
      if (lab && lab !== lastLab) {
        let next;
        do { next = Math.floor(Math.random() * shapes.length); } while (next === shapeIx && shapes.length > 1);
        shapeIx = next;
        shapes.forEach((sh, i) => sh.classList.toggle('active', i === shapeIx));
        cur.style.setProperty('--off', shapes[shapeIx].dataset.off + '%');
      }
      lastLab = lab;
      cur.classList.toggle('label', !!lab);
      cur.classList.toggle('link', !lab && !!link);
      if (lab) txt.textContent = lab.dataset.cursor;
    });
  }

  /* ---------- Project pages: videos play while on screen ---------- */
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); }
      else v.pause();
    }), { threshold: .25 });
    document.querySelectorAll('.gallery video').forEach(v => { v.muted = true; vio.observe(v); });
  }

  /* ---------- Footer: the logo's shapes fly in and come "together" ---------- */
  (() => {
    const big = document.querySelector('footer .big');
    const src = document.querySelector('header .mark path');
    if (!big || !src) return;
    const NS = 'http://www.w3.org/2000/svg';
    const vb = document.querySelector('header .mark').getAttribute('viewBox');
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'assemble'); svg.setAttribute('viewBox', vb); svg.setAttribute('aria-hidden', 'true');
    // wrap the word and the mark together, so hovering either keeps the logo assembled
    const word = big.querySelector('em');
    const tg = document.createElement('span'); tg.className = 'tg';
    if (word) { word.replaceWith(tg); tg.appendChild(word); } else big.appendChild(tg);
    tg.appendChild(svg);
    // split the mark into its separate shapes (each outline ring = outer contour + its inner hole)
    const subs = src.getAttribute('d').split(/(?=M)/).filter(Boolean).map(d => {
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); svg.appendChild(p);
      const b = p.getBBox(); p.remove(); return { d, b, area: b.width * b.height };
    }).sort((a, b) => b.area - a.area);
    const groups = [];
    subs.forEach(s => {
      const host = groups.find(g => s.b.x >= g.b.x && s.b.y >= g.b.y && s.b.x + s.b.width <= g.b.x + g.b.width && s.b.y + s.b.height <= g.b.y + g.b.height);
      if (host) host.d += s.d; else groups.push({ d: s.d, b: s.b });
    });
    const scatter = [[-900, -700, -40], [700, -800, 35], [-600, 600, -25], [900, 450, 50], [250, -1000, -60]];
    groups.forEach((g, i) => {
      const el = document.createElementNS(NS, 'g');
      const [x, y, r] = scatter[i % scatter.length];
      el.style.setProperty('--x', x + 'px'); el.style.setProperty('--y', y + 'px');
      el.style.setProperty('--r', r + 'deg'); el.style.setProperty('--d', (i * 0.08) + 's');
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', g.d); p.setAttribute('fill-rule', 'evenodd');
      el.appendChild(p); svg.appendChild(el);
    });
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      // desktop: the shapes fly in and come together while the word is hovered
      tg.addEventListener('mouseenter', () => svg.classList.add('on'));
      tg.addEventListener('mouseleave', () => svg.classList.remove('on'));
    } else if ('IntersectionObserver' in window) {
      // touch screens have no hover: assemble when the footer scrolls into view
      new IntersectionObserver(es => es.forEach(e => svg.classList.toggle('on', e.isIntersecting)), { threshold: .6 }).observe(big);
    } else svg.classList.add('on');
  })();

  /* ---------- Email links: click copies the address ---------- */
  document.querySelectorAll('a.contact-link[href^="mailto:"]').forEach(a => {
    a.addEventListener('click', async e => {
      const addr = a.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
      let ok = false;
      try { await navigator.clipboard.writeText(addr); ok = true; } catch (err) {
        try {
          const t = document.createElement('textarea'); t.value = addr; t.style.cssText = 'position:fixed;opacity:0';
          document.body.appendChild(t); t.select(); ok = document.execCommand('copy'); t.remove();
        } catch (err2) {}
      }
      if (!ok) return;            // couldn't copy: let the mail app open as before
      e.preventDefault();
      if (!a.dataset.label) a.dataset.label = a.textContent;
      a.textContent = 'Copied ☺';
      clearTimeout(a._t); a._t = setTimeout(() => { a.textContent = a.dataset.label; }, 1600);
    });
  });
