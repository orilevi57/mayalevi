/* ---------- Work index: filters + cursor preview ---------- */
(() => {
  const btns = document.querySelectorAll('.filters button');
  const items = document.querySelectorAll('.w-list li');
  const count = document.querySelector('.w-hero sup');
  btns.forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.f;
    btns.forEach(x => x.setAttribute('aria-pressed', x === b));
    let n = 0;
    items.forEach(li => {
      const show = f === 'all' || li.dataset.tags.split(' ').includes(f);
      li.hidden = !show; if (show) n++;
    });
    if (count) count.textContent = '(' + String(n).padStart(2, '0') + ')';
  }));

  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pv = document.querySelector('.w-preview');
  if (!fine || !pv) return;
  const img = pv.querySelector('img');
  let x = 0, y = 0, cx = 0, cy = 0, s = .85, ts = .85, raf = 0;
  const tick = () => {
    const k = reduce ? 1 : .14;
    cx += (x - cx) * k; cy += (y - cy) * k; s += (ts - s) * .18;
    pv.style.transform = `translate3d(${cx + 40}px, ${cy}px, 0) translate(0, -50%) scale(${s})`;
    raf = requestAnimationFrame(tick);
  };
  document.querySelectorAll('.w-row').forEach(r => {
    r.addEventListener('mouseenter', e => {
      if (!raf) { cx = x = e.clientX; cy = y = e.clientY; tick(); }
      img.src = r.dataset.img; pv.classList.add('on'); ts = 1;
    });
    r.addEventListener('mouseleave', () => { pv.classList.remove('on'); ts = .85; });
  });
  addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; });
})();
