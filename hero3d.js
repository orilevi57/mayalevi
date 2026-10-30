/* Hero chain — small puffy versions of Maya's logo shapes plus the Hyro character flow as a chain
   through the headline while it's hovered; the cursor pulls the chain toward it, each one spinning on its own axis and weaving
   in front of and behind the letters. Touch screens: tap the headline to toggle.
   three.js loads lazily once the page is idle. */
(function () {
  const hero = document.querySelector('.hero');
  const h1 = hero && hero.querySelector('h1');
  if (!h1) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

  let ready = null, want = false, setActive = () => {};
  function load() {
    if (ready) return ready;
    ready = new Promise((res, rej) => {
      if (window.THREE) return res();
      const s = document.createElement('script');
      s.src = THREE_URL; s.async = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    }).then(init).catch(() => {});
    return ready;
  }
  (window.requestIdleCallback || ((f) => setTimeout(f, 1200)))(load);

  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    h1.addEventListener('mouseenter', () => { want = true; load().then(() => setActive(true)); });
    h1.addEventListener('mouseleave', () => { want = false; setActive(false); });
  } else {
    h1.addEventListener('click', () => { want = !want; load().then(() => setActive(want)); });
  }

  function init() {
    const T = window.THREE;
    // two layers: one behind the headline, one in front — objects hop between them to weave
    const back = document.createElement('canvas'), front = document.createElement('canvas');
    back.className = 'hero3d hero3d-back'; front.className = 'hero3d hero3d-front';
    back.setAttribute('aria-hidden', 'true'); front.setAttribute('aria-hidden', 'true');
    hero.prepend(back); hero.append(front);
    const mk = (c) => { const r = new T.WebGLRenderer({ canvas: c, antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.outputEncoding = T.sRGBEncoding; return r; };
    const rBack = mk(back), rFront = mk(front);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 20);

    // soft pastel body + lilac rim
    const vert = `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position;
        gl_Position = projectionMatrix * mv; }`;
    const frag = `uniform vec3 cA; uniform vec3 cB; uniform vec3 rim; uniform float op;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        vec3 L = normalize(vec3(-0.4, 0.6, 0.7));
        vec3 base = mix(cA, cB, smoothstep(0.0, 1.0, vP.y + 0.5 + vN.x * 0.25));
        float fr = pow(1.0 - abs(dot(vN, vV)), 2.2);
        float light = 0.8 + 0.2 * abs(dot(vN, L));
        float spec = pow(max(dot(reflect(-L, vN), vV), 0.0), 18.0) * 0.25;
        gl_FragColor = vec4(base * light + rim * fr * 0.85 + spec, op); }`;
    const palettes = [
      ['#F6C98E', '#F3E6B0', '#E7B6F0'], ['#CFE8B4', '#F5E7B3', '#E9B8EE'],
      ['#F3B7CF', '#F7D9C4', '#D9B6F5'], ['#B9D8F2', '#E4F1D2', '#E2B5F2'], ['#F7E0A3', '#D6EDC0', '#EBB3E6'],
    ];

    // logo outlines, read from the cursor SVGs already on the page
    const svgs = [...document.querySelectorAll('.cursor .cursor-shape')];
    const holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    document.body.appendChild(holder);
    const geos = svgs.map((svg) => {
      const vb = svg.viewBox.baseVal, d = svg.querySelector('path').getAttribute('d');
      let best = null, bestLen = 0;
      for (const sd of d.split(/(?=M)/).filter(Boolean)) {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', sd); holder.appendChild(p);
        const len = p.getTotalLength(); if (len > bestLen) { bestLen = len; best = p; }
      }
      const pts = [], N = 120, s = 1 / Math.max(vb.width, vb.height);
      for (let i = 0; i < N; i++) { const q = best.getPointAtLength((i / N) * bestLen); pts.push(new T.Vector2((q.x - vb.width / 2) * s, -(q.y - vb.height / 2) * s)); }
      if (T.ShapeUtils.isClockWise(pts)) pts.reverse();
      const g = new T.ExtrudeGeometry(new T.Shape(pts), { depth: 0.18, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.07, bevelSegments: 12, curveSegments: 2 });
      g.center(); return g;
    });
    // the Encore horse, traced from the logo
    const HORSE = { w: 576, h: 432, d: 'M44 406C51 403 58 401 62 400C64 399 68 398 70 397C76 394 86 385 88 380C89 378 92 374 94 371C97 369 99 365 100 363C101 362 104 358 106 355C109 353 111 349 112 348C115 343 121 336 126 332C130 329 132 328 135 328C138 328 141 327 144 326C147 324 150 324 158 324C164 324 168 323 172 322C178 320 185 317 191 316C193 315 197 314 199 313C201 312 204 311 206 310C209 310 212 308 214 307C216 306 220 303 222 301C225 299 230 296 232 294C235 293 239 290 241 288C244 286 244 285 244 281C244 278 245 274 246 272C248 269 248 266 248 260C248 248 248 248 270 248C284 248 289 248 291 249C293 250 296 251 298 252C302 253 309 255 316 258C319 259 323 260 328 260C334 260 337 261 340 262C343 263 347 264 352 264C357 264 361 263 364 262C367 261 370 260 374 260C377 260 381 259 384 258C386 257 389 256 390 256C391 256 399 252 408 248C419 242 425 240 428 240C430 240 433 239 436 238C441 236 443 236 448 238C451 239 454 240 456 240C458 240 462 241 463 242C465 243 469 244 472 244C475 245 480 246 484 247C491 250 493 252 491 256C490 259 488 260 482 257C473 254 466 258 458 270C454 278 454 279 464 280C469 280 472 280 475 278C478 277 481 276 483 276C486 275 488 273 492 269C502 260 507 256 511 256C519 256 522 260 516 264C512 267 490 288 488 292C484 299 479 302 473 298C470 297 467 297 462 299C456 302 450 308 447 313C444 319 444 322 448 323C450 324 451 324 455 322C459 321 463 320 468 320C472 320 476 319 478 319C479 318 482 316 485 314C487 313 499 302 510 291C522 279 533 269 536 268C542 265 544 262 544 256C544 252 543 250 541 247C537 242 533 235 533 232C533 230 535 227 538 224C544 217 544 215 538 209C535 206 533 204 532 204C532 204 529 202 527 201C524 199 520 197 518 196C514 195 507 193 500 190C497 189 493 188 489 188C483 188 483 188 479 185C476 181 476 181 476 163C476 144 476 144 472 136C468 128 468 128 468 112C468 96 468 96 471 90C475 82 478 81 480 86C481 91 486 99 489 102C491 104 494 108 496 110C499 114 500 116 500 120C500 122 499 126 498 128C495 133 495 135 499 141C501 145 501 145 506 145C513 144 521 140 523 138C523 136 524 134 524 132C524 130 525 126 526 124C527 122 528 118 528 116C528 114 529 110 530 108C531 105 532 102 532 98C532 94 533 91 534 88C536 84 536 82 536 72L535 61L540 60C543 59 544 58 544 57C543 52 543 51 547 49C551 46 552 43 549 41C546 40 537 40 533 42C528 44 526 43 520 38C514 33 505 28 502 28C501 28 498 27 496 26C490 23 478 23 472 26C470 27 466 28 464 28C462 28 459 29 457 30C455 30 451 32 449 32C447 33 443 34 441 35C439 36 435 37 432 38C430 39 425 40 422 41C420 42 415 44 413 44C409 46 405 47 399 49C396 50 396 53 399 58C402 64 401 67 397 70C394 71 391 72 389 72C387 73 385 74 384 75C383 75 380 78 377 79C370 83 366 88 368 90C368 91 371 92 379 92C384 92 389 93 390 93C395 97 385 108 377 108C374 108 371 109 368 110C366 111 362 112 360 112C356 112 353 114 353 116C353 117 355 121 358 124C365 131 365 134 357 137C347 142 342 143 332 144C326 144 321 145 319 146C316 148 312 148 284 148C255 148 252 148 248 150C245 151 242 152 238 152C235 152 231 153 228 154C226 155 222 156 220 156C217 156 212 158 204 162C189 169 185 170 178 164C176 162 170 159 165 156C156 152 156 152 140 152C124 152 124 152 114 157C103 163 97 167 89 174C86 176 82 179 80 180C79 181 75 183 73 186C70 188 66 191 65 192C60 194 53 201 53 204C53 208 60 209 68 206C78 202 82 206 76 214C74 217 72 221 70 223C66 229 53 241 48 244C46 245 44 246 44 247C43 248 40 250 36 252C32 254 29 257 29 257C29 260 38 261 44 258C47 257 50 256 54 256C57 256 61 255 64 254C66 253 69 252 70 252C72 252 89 244 94 240C97 238 100 236 102 235C104 234 106 232 107 230C108 228 110 224 112 222C114 219 116 216 116 214C116 211 121 201 124 197C126 196 128 193 128 191C131 186 139 178 146 175C151 172 153 172 160 172C167 172 169 172 172 174C175 176 177 177 177 178C177 180 174 186 168 194C164 199 160 207 160 210C160 211 159 214 158 216C156 220 156 222 156 242C156 264 156 264 153 270C151 273 149 277 147 279C145 281 137 286 128 290C111 298 104 304 104 309C104 312 72 377 69 380C67 383 65 382 59 380C52 376 50 376 43 384C38 389 36 392 36 394C36 395 35 398 34 399C33 402 33 406 35 407C37 408 38 408 44 406Z' };
    const horseGeo = (() => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', HORSE.d); holder.appendChild(p);
      const L = p.getTotalLength(), pts = [], N = 220, sc = 1 / Math.max(HORSE.w, HORSE.h);
      for (let i = 0; i < N; i++) { const q = p.getPointAtLength((i / N) * L); pts.push(new T.Vector2((q.x - HORSE.w / 2) * sc, -(q.y - HORSE.h / 2) * sc)); }
      if (T.ShapeUtils.isClockWise(pts)) pts.reverse();
      const g = new T.ExtrudeGeometry(new T.Shape(pts), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.025, bevelSegments: 8, curveSegments: 2 });
      g.center(); return g;
    })();
    holder.remove();

    const tex = new T.TextureLoader().load('hero-character.webp');
    tex.encoding = T.sRGBEncoding;
    const charGeo = new T.PlaneGeometry(0.78, 0.78 * 640 / 501);
    const memTex = new T.TextureLoader().load('hero-memoria.webp'); memTex.encoding = T.sRGBEncoding;
    const memGeo = new T.PlaneGeometry(0.9, 0.9 * 366 / 426);
    const horsePal = ['#3346E0', '#7A88F4', '#F59AC0'];   // Encore blue with a pink rim

    // the chain: shapes in rotation, with the character every so often
    const COUNT = 13, order = ['c', 0, 'h', 1, 'm', 2, 3, 'c', 4, 'h', 2, 'm', 0];
    const items = [];
    for (let i = 0; i < COUNT; i++) {
      const kind = order[i % order.length];
      let obj, mat;
      if (kind === 'c' || kind === 'm') {
        mat = new T.MeshBasicMaterial({ map: kind === 'c' ? tex : memTex, transparent: true, depthWrite: false, side: T.DoubleSide });
        obj = new T.Mesh(kind === 'c' ? charGeo : memGeo, mat);
      } else if (kind === 'h') {
        mat = new T.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true,
          uniforms: { cA: { value: new T.Color(horsePal[0]) }, cB: { value: new T.Color(horsePal[1]) }, rim: { value: new T.Color(horsePal[2]) }, op: { value: 1 } } });
        obj = new T.Mesh(horseGeo, mat);
      } else {
        const pal = palettes[(i + kind) % palettes.length];
        mat = new T.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true,
          uniforms: { cA: { value: new T.Color(pal[0]) }, cB: { value: new T.Color(pal[1]) }, rim: { value: new T.Color(pal[2]) }, op: { value: 1 } } });
        obj = new T.Mesh(geos[kind % geos.length], mat);
      }
      obj.scale.setScalar(0.0001); scene.add(obj);
      items.push({ obj, mat, isChar: kind === 'c' || kind === 'm', isMem: kind === 'm', isHorse: kind === 'h', k: 0, spin: (i % 2 ? 1 : -1) * (0.7 + Math.random() * 0.3), seed: Math.random() * 6 });
    }

    // the path: weaves through line 1 left→right, drops, line 2 right→left, rises back — a closed loop
    let W = 1, H = 1, unit = 1, size = 40, path = null, pathLen = 1, lines_n = 2;
    const toWorld = (x, y) => new T.Vector3((x - W / 2) * unit, -(y - H / 2) * unit, 0);
    function build() {
      const r = hero.getBoundingClientRect(); W = r.width; H = r.height;
      rBack.setSize(W, H, false); rFront.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
      unit = (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z) / H;
      // one entry per visual line of text (lines can wrap on phones)
      const lines = [];
      h1.querySelectorAll('.line > span').forEach((s) => {
        const rg = document.createRange(); rg.selectNodeContents(s);
        const rows = [];
        [...rg.getClientRects()].filter((b) => b.width > 2).sort((a, b) => a.top - b.top).forEach((b) => {
          const mid = (b.top + b.bottom) / 2;
          const L = rows.find((R) => mid > R.top && mid < R.bottom);   // same visual line (e.g. the italic "Maya")
          if (L) { L.x0 = Math.min(L.x0, b.left); L.x1 = Math.max(L.x1, b.right); }
          else rows.push({ x0: b.left, x1: b.right, top: b.top, bottom: b.bottom });
        });
        rows.forEach((L) =>
          lines.push({ x0: L.x0 - r.left, x1: L.x1 - r.left, y: (L.top + L.bottom) / 2 - r.top, h: L.bottom - L.top }));
      });
      if (!lines.length) return;
      lines_n = lines.length;
      const lh = lines[0].h; size = Math.max(26, Math.min(52, lh * 0.38));
      const amp = lh * 0.2, pts = [];
      const wave = (L, dir) => {
        const n = Math.max(8, Math.round((L.x1 - L.x0) / (lh * 0.55)));
        for (let j = 0; j <= n; j++) {
          const f = dir > 0 ? j / n : 1 - j / n;
          pts.push(toWorld(L.x0 + f * (L.x1 - L.x0), L.y + Math.sin(j * 1.15) * amp));
        }
      };
      const pad = size * 0.8, xmin = size * 0.6, xmax = W - size * 0.6;
      lines.forEach((L, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        if (i > 0) { const P = lines[i - 1]; const edge = dir < 0 ? Math.min(xmax, Math.max(P.x1, L.x1) + pad) : Math.max(xmin, Math.min(P.x0, L.x0) - pad); pts.push(toWorld(edge, (P.y + L.y) / 2)); }
        wave(L, dir);
      });
      // return leg, tucked just under the last line and back up the left side
      const A = lines[0], Z = lines[lines.length - 1];
      const endRight = (lines.length - 1) % 2 === 0;
      if (endRight) pts.push(toWorld(Math.min(xmax, Z.x1 + pad), Z.y + Z.h * 0.45));
      pts.push(toWorld(Math.max(xmin, Math.min(A.x0, Z.x0) - pad), Z.y + Z.h * 0.45));
      pts.push(toWorld(Math.max(xmin, A.x0 - pad), A.y - A.h * 0.1));
      path = new T.CatmullRomCurve3(pts, true, 'centripetal');
      pathLen = path.getLength();
    }
    build();
    addEventListener('resize', build);
    if (document.fonts) document.fonts.ready.then(build);

    // motion: the chain keeps flowing on its own loop through the headline; the cursor pulls the nearby
    // part of the chain toward it (a soft bend, so neighbours move together) and nudges the pace
    const mouse = { x: 1e6, y: 1e6, px: 0, py: 0, has: false, v: 0 };
    addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left - W / 2) * unit, y = -(e.clientY - r.top - H / 2) * unit;
      if (mouse.has) mouse.v += Math.hypot(x - mouse.px, y - mouse.py);
      mouse.x = mouse.px = x; mouse.y = mouse.py = y; mouse.has = true;
    }, { passive: true });

    let active = false, changedAt = 0, running = false, last = 0, head = 0, pace = 0;
    setActive = (on) => {
      if (on === active) return;
      if (on) build();               // re-measure: the headline slides in on load, so early measurements are off
      active = on; changedAt = performance.now();
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
    };
    if (want) setActive(true);

    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const t = now / 1000, since = (now - changedAt) / 1000;
      const S = size * unit;
      // pace: a calm base speed, gently lifted while the cursor is moving
      const moving = Math.min(2, mouse.v / Math.max(dt, 1e-3) / (S * 20)); mouse.v = 0;
      pace += (moving - pace) * Math.min(1, dt * 2.5);
      head = (head + dt * (reduce ? 0 : (S * 3.4 * (1 + pace * 0.8)) / pathLen)) % 1;
      const gap = (S * 1.3) / pathLen;
      const reach = S * 5;
      let alive = false;
      items.forEach((it, i) => {
        const delay = active ? i * 0.05 : (COUNT - 1 - i) * 0.025;
        const target = active ? 1 : 0;
        if (since > delay) it.k += (target - it.k) * Math.min(1, dt * (reduce ? 60 : 7));
        if (Math.abs(target - it.k) > 0.003 || active) alive = true;
        const u = ((head - i * gap) % 1 + 1) % 1;
        const p = path.getPointAt(u);
        // pull toward the cursor with a wide, smooth falloff
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
        const f = reduce || !active ? 0 : Math.exp(-d2 / (reach * reach)) * 0.6;
        it.ox = (it.ox || 0) + (dx * f - (it.ox || 0)) * Math.min(1, dt * 3);
        it.oy = (it.oy || 0) + (dy * f - (it.oy || 0)) * Math.min(1, dt * 3);
        const weave = Math.sin(u * Math.PI * 2 * (lines_n * 4 + 1) + 0.6);   // > 0: in front of the letters
        it.front = weave > 0;
        const pop = active ? 1 + 0.2 * Math.sin(Math.min(1, it.k) * Math.PI) : 1;
        const grow = it.isMem ? 1.7 : it.isHorse ? 1.3 : it.isChar ? 1.25 : 1;
        it.obj.scale.setScalar(Math.max(0.0001, it.k * pop * S * grow * (0.94 + 0.06 * weave)));
        it.obj.position.set(p.x + it.ox, p.y + it.oy, weave * 0.4);
        it.turn = (it.turn || 0) + dt * it.spin * (0.55 + pace * 0.6);
        if (it.isChar) {
          it.obj.rotation.set(0, Math.sin(t * 1.2 + it.seed) * 0.45, Math.sin(t * 1.6 + it.seed) * 0.14 - it.ox * 0.15);
        } else if (it.isHorse) {
          // the horse gallops: faces its direction of travel and rocks, instead of spinning
          const q = path.getPointAt((u + 0.002) % 1), dirX = q.x - p.x;
          it.obj.rotation.set(Math.sin(t * 3 + it.seed) * 0.12, dirX < 0 ? Math.PI : 0, Math.sin(t * 5 + it.seed) * 0.12);
        } else {
          it.obj.rotation.set(0.35 + Math.sin(t * 0.8 + it.seed) * 0.15, reduce ? 0.4 : it.turn + it.seed, Math.sin(t * 0.7 + it.seed) * 0.12);
        }
        if (it.mat.uniforms) it.mat.uniforms.op.value = Math.min(1, it.k * 1.5); else it.mat.opacity = Math.min(1, it.k * 1.5);
      });
      items.forEach((it) => (it.obj.visible = !it.front)); rBack.render(scene, camera);
      items.forEach((it) => (it.obj.visible = it.front)); rFront.render(scene, camera);
      if (alive) requestAnimationFrame(tick); else running = false;
    }
  }
})();
