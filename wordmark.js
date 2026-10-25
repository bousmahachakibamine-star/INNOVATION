/* ============================================================
   INNOVATION — pseudo du site animé
   Le mot INNOVATION se forme en tourbillon de particules, le
   premier O devient un atome (orbites, électrons, noyau), puis
   le mot se fige en dégradé bleu marine avec un éclat qui le
   traverse. Il se lance quand la bannière héros affiche son
   contenu (#post « show »), se rejoue à chaque « ↻ » et s'arrête
   dès que le héros quitte l'écran (zéro CPU inutile).
   Sans canvas, ou si l'utilisateur demande moins d'animations,
   le titre « Innovation » reste un simple texte.
   ============================================================ */
(function () {
  'use strict';

  var h1 = document.querySelector('.hero-word');
  var cv = document.getElementById('motCanvas');
  var post = document.getElementById('post');
  if (!h1 || !cv || !post) return;
  if (!cv.getContext) return;

  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var TEXT = 'INNOVATION', AI = 3, TRACK = 0.10;
  var FONT = '"Poppins","Segoe UI",system-ui,sans-serif';
  var COLORS = ['#1b2370', '#232d85', '#2f4aa8', '#4a7be0', '#8ea0ff'];
  var LARGEUR_MAX = 880;
  var TWO = Math.PI * 2;

  var W = 0, H = 0, dpr = 1, L = {}, P = [], buckets = [];
  var T = 0, t0 = 0, raf = 0, actif = false, heroVisible = true, pause = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- Mesure : taille des lettres, place de l'atome ---------- */
  function mesurer() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(260, Math.min(Math.round(h1.getBoundingClientRect().width || 640), LARGEUR_MAX));

    var m = document.createElement('canvas').getContext('2d');
    m.font = '700 100px ' + FONT;
    var ws = [], i, em = 0;
    for (i = 0; i < TEXT.length; i++) ws.push(m.measureText(TEXT[i]).width / 100);
    var capEm = (m.measureText('H').actualBoundingBoxAscent || 70) / 100;
    ws[AI] = capEm * 1.3 + 0.05;               // place réservée à l'atome
    for (i = 0; i < ws.length; i++) em += ws[i];
    em += TRACK * (TEXT.length - 1);
    /* Filet de sécurité : si la mesure est impossible (aucune police disponible),
       on retombe sur la largeur moyenne d'une capitale plutôt que de tout écraser. */
    if (!(em > 2)) em = TEXT.length * 0.78;

    var fs = W / em, cap = capEm * fs;
    H = Math.max(48, Math.ceil(fs * 1.5));
    var x0 = (W - em * fs) / 2, cy = H / 2, xs = [], x = x0;
    for (i = 0; i < TEXT.length; i++) { xs.push(x); x += (ws[i] + TRACK) * fs; }

    L = { fs: fs, tw: em * fs, x0: x0, cy: cy, cap: cap, base: cy + cap / 2, xs: xs, ws: ws };
    L.ax = xs[AI] + ws[AI] * fs / 2;
    L.ay = cy;
    L.R = cap * 0.62;
    L.r = L.R * 0.34;

    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- Points du texte : on dessine les lettres hors écran
     (sans le O, remplacé par l'atome) et on prélève des pixels ---------- */
  function prelever() {
    var pad = 20, w = Math.ceil(L.tw + pad * 2), h = Math.ceil(L.fs * 1.5);
    var oc = document.createElement('canvas');
    oc.width = w; oc.height = h;
    var o = oc.getContext('2d', { willReadFrequently: true });
    o.font = '700 ' + L.fs + 'px ' + FONT;
    o.fillStyle = '#fff';
    o.textBaseline = 'alphabetic';
    var by = Math.round(L.fs * 1.1), i, x, y;
    for (i = 0; i < TEXT.length; i++) if (i !== AI) o.fillText(TEXT[i], L.xs[i] - L.x0 + pad, by);

    var d = o.getImageData(0, 0, w, h).data, cnt = 0;
    for (i = 3; i < d.length; i += 4) if (d[i] > 128) cnt++;
    var want = Math.min(3400, Math.round(cnt / 4)), p = cnt ? want / cnt : 0, pts = [];
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 128 && Math.random() < p) {
          pts.push([x - pad + L.x0 + Math.random(), y - by + L.base + Math.random()]);
        }
      }
    }
    return pts;
  }

  function newP(col) {
    return { k: 0, col: col, tx: 0, ty: 0, bx: 0, by: 0, x: 0, y: 0, sx: 0, sy: 0, cx: 0, cy: 0,
             d: 0, du: 1, s: rnd(1.1, 2.1), a: rnd(0.55, 1), th: 0, om: 0, orb: 0,
             al: 0, sz: 1, ph: rnd(0, TWO) };
  }

  /* Départ lointain + trajectoire courbe (effet de tourbillon) */
  function trace(p, tx, ty) {
    var ang = rnd(0, TWO), far = Math.max(W, H) * 0.75, rad = far * rnd(0.55, 1.15);
    p.sx = W / 2 + Math.cos(ang) * rad;
    p.sy = L.cy + Math.sin(ang) * rad * 0.8;
    var dx = tx - p.sx, dy = ty - p.sy, dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var sw = (Math.random() < 0.85 ? 1 : -1) * rnd(0.25, 0.6) * dist;
    p.cx = (p.sx + tx) / 2 + (-dy / dist) * sw;
    p.cy = (p.sy + ty) / 2 + (dx / dist) * sw;
  }

  function init() {
    P = [];
    var pts = prelever(), i, p, o;

    for (i = 0; i < pts.length; i++) {
      var r = Math.random();
      p = newP(r < 0.62 ? 0 : (r < 0.86 ? 1 : (r < 0.96 ? 2 : 3)));
      p.tx = pts[i][0]; p.ty = pts[i][1];
      trace(p, p.tx, p.ty);
      p.d = 0.35 + clamp((p.tx - L.x0) / L.tw, 0, 1) * 1.3 + rnd(0, 0.25);
      p.du = rnd(1.1, 1.55);
      P.push(p);
    }

    /* Atome : 3 orbites + électrons */
    for (o = 0; o < 3; o++) {
      for (i = 0; i < 85; i++) {
        p = newP(3);
        p.k = 1; p.orb = o; p.th = rnd(0, TWO);
        p.om = (o % 2 ? 1 : -1) * rnd(0.2, 0.34);
        p.s = rnd(0.9, 1.6);
        trace(p, L.ax, L.ay);
        p.d = rnd(0.1, 0.65); p.du = rnd(1.4, 1.9);
        P.push(p);
      }
      p = newP(4);
      p.k = 1; p.orb = o; p.th = rnd(0, TWO);
      p.om = (o % 2 ? 1 : -1) * rnd(1.5, 2.1);
      p.s = 3.4; p.a = 1;
      trace(p, L.ax, L.ay);
      p.d = 0.5 + o * 0.1; p.du = 1.7;
      P.push(p);
    }

    /* Noyau */
    for (i = 0; i < 60; i++) {
      p = newP(4);
      p.k = 2;
      var g = rnd(0, TWO), gr = Math.abs(rnd(-1, 1) + rnd(-1, 1)) * L.cap * 0.05;
      p.tx = L.ax + Math.cos(g) * gr;
      p.ty = L.ay + Math.sin(g) * gr;
      p.s = rnd(1.3, 2.4); p.a = 1;
      trace(p, p.tx, p.ty);
      p.d = rnd(0.3, 0.8); p.du = rnd(1.3, 1.7);
      P.push(p);
    }

    buckets = [];
    for (i = 0; i < COLORS.length; i++) buckets.push([]);
    for (i = 0; i < P.length; i++) buckets[P[i].col].push(P[i]);
  }

  /* ---------- Physique ---------- */
  function atomPos(p, out) {
    var th = p.th + T * p.om;
    var lx = L.R * Math.cos(th), ly = L.r * Math.sin(th);
    var a = p.orb * Math.PI / 3 + T * 0.3, c = Math.cos(a), s = Math.sin(a);
    out.x = L.ax + lx * c - ly * s;
    out.y = L.ay + lx * s + ly * c;
  }
  var tmp = { x: 0, y: 0 };

  function step(p) {
    var bx = p.tx, by = p.ty;
    if (p.k === 1) { atomPos(p, tmp); bx = tmp.x; by = tmp.y; }
    else if (p.k === 2) {
      var br = 1 + Math.sin(T * 2.2 + p.ph) * 0.12;
      bx = L.ax + (p.tx - L.ax) * br;
      by = L.ay + (p.ty - L.ay) * br;
    }
    var arr = p.d + p.du, u = clamp((T - p.d) / p.du, 0, 1);
    if (u < 1) {
      var e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, ie = 1 - e;
      p.x = ie * ie * p.sx + 2 * ie * e * p.cx + e * e * bx;
      p.y = ie * ie * p.sy + 2 * ie * e * p.cy + e * e * by;
    } else {
      p.x = bx; p.y = by;
    }
    var al = p.a * Math.min(1, T / 0.8), sz = p.s;
    if (p.k !== 3) {
      var since = T - arr;
      if (since > 0 && since < 0.45) sz *= 1 + (1 - since / 0.45) * 1.7;   // « pop » à l'arrivée
    }
    p.al = al; p.sz = sz;
  }

  /* ---------- Mot plein, dégradé + éclat traversant ---------- */
  function dessinerMot(reveal) {
    if (reveal <= 0) return;
    var i, sp = -0.25 + clamp((T - 3.0) / 1.1, 0, 1) * 1.5;
    ctx.globalAlpha = reveal;
    var g = ctx.createLinearGradient(L.x0, 0, L.x0 + L.tw, 0);
    g.addColorStop(0, '#1b2370');
    g.addColorStop(clamp(sp - 0.14, 0, 1), '#1b2370');
    g.addColorStop(clamp(sp, 0, 1), '#4a7be0');
    g.addColorStop(clamp(sp + 0.14, 0, 1), '#1b2370');
    g.addColorStop(1, '#1b2370');
    ctx.fillStyle = g;
    ctx.font = '700 ' + L.fs + 'px ' + FONT;
    ctx.textBaseline = 'alphabetic';
    for (i = 0; i < TEXT.length; i++) if (i !== AI) ctx.fillText(TEXT[i], L.xs[i], L.base);

    ctx.lineWidth = Math.max(1, L.fs * 0.012);
    ctx.strokeStyle = 'rgba(74, 123, 224, .85)';
    for (i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(L.ax, L.ay, L.R, L.r, i * Math.PI / 3 + T * 0.3, 0, TWO);
      ctx.stroke();
    }
    ctx.fillStyle = '#2f4aa8';
    ctx.beginPath();
    ctx.arc(L.ax, L.ay, L.cap * 0.08 * (1 + Math.sin(T * 2.2) * 0.08), 0, TWO);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* Onde de choc au moment où l'atome s'assemble */
  function dessinerChoc() {
    var k, u, rad;
    for (k = 0; k < 2; k++) {
      u = clamp((T - (2.45 + k * 0.16)) / 1.3, 0, 1);
      if (u <= 0 || u >= 1) continue;
      rad = (1 - Math.pow(1 - u, 3)) * L.fs * 4.2;
      ctx.globalAlpha = Math.pow(1 - u, 2) * 0.5;
      ctx.strokeStyle = '#4a7be0';
      ctx.lineWidth = 1 + (1 - u) * 2.5;
      ctx.beginPath();
      ctx.arc(L.ax, L.ay, rad, 0, TWO);
      ctx.stroke();
    }
    u = clamp((T - 2.45) / 1.0, 0, 1);
    if (u > 0 && u < 1) {
      var R = L.cap * 2.4;
      var gr = ctx.createRadialGradient(L.ax, L.ay, 0, L.ax, L.ay, R);
      gr.addColorStop(0, 'rgba(74,123,224,.42)');
      gr.addColorStop(1, 'rgba(74,123,224,0)');
      ctx.globalAlpha = Math.pow(1 - u, 2);
      ctx.fillStyle = gr;
      ctx.fillRect(L.ax - R, L.ay - R, R * 2, R * 2);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Boucle ---------- */
  function frame(now) {
    raf = 0;
    T = (now - t0) / 1000;
    if (T < 0) T =0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (T < 3.5 && T > 0.3) {                       // traînées pendant l'assemblage
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.26)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.clearRect(0, 0, W, H);
    }

    dessinerMot(clamp((T - 3.0) / 0.9, 0, 1));

    var b, i, list, p;
    for (b = 0; b < buckets.length; b++) {
      list = buckets[b];
      if (!list.length) continue;
      ctx.fillStyle = COLORS[b];
      for (i = 0; i < list.length; i++) {
        p = list[i];
        step(p);
        ctx.globalAlpha = p.al;
        ctx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz);
      }
    }
    ctx.globalAlpha = 1;
    dessinerChoc();

    if (actif && heroVisible) raf = requestAnimationFrame(frame);
    else pause = now;
  }

  /* ---------- Marche / arrêt ---------- */
  function texteSeul() {
    actif = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    cv.hidden = true;
    h1.classList.remove('is-canvas');
  }

  function lancer(settled) {
    if (reduce.matches) { texteSeul(); return; }
    try {
      cv.hidden = false;
      h1.classList.add('is-canvas');
      mesurer();
      init();
      actif = true;
      t0 = performance.now() - (settled ? 10000 : 0);
      if (raf) cancelAnimationFrame(raf);
      pause = 0;
      raf = requestAnimationFrame(frame);
    } catch (e) {
      console.warn('Pseudo animé indisponible : titre en texte simple.', e);
      texteSeul();
    }
  }

  function arreter() {
    actif = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  /* Le héros sort de l'écran → la boucle dort ; il revient → reprise
     là où elle s'était arrêtée (le temps d'arrêt est ajouté au départ). */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var vu = es[0].isIntersecting;
      if (vu === heroVisible) return;
      heroVisible = vu;
      if (!actif) return;
      if (vu) {
        if (pause) { t0 += performance.now() - pause; pause = 0; }
        if (!raf) raf = requestAnimationFrame(frame);
      } else if (raf) {
        cancelAnimationFrame(raf); raf = 0; pause = performance.now();
      }
    }, { threshold: 0 }).observe(document.getElementById('hero') || h1);
  }

  /* ---------- Déclencheur : le contenu du héros est affiché ---------- */
  var pret = false;
  function demarrerSiPret() {
    if (pret && post.classList.contains('show') && !actif) lancer(false);
  }

  if ('MutationObserver' in window) {
    new MutationObserver(function () {
      if (post.classList.contains('show')) demarrerSiPret();
      else arreter();
    }).observe(post, { attributes: true, attributeFilter: ['class'] });
  }

  /* Redimensionnement : on remesure et on repart de l'état formé */
  var rt = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (post.classList.contains('show')) lancer(true); }, 220);
  });

  reduce.addEventListener && reduce.addEventListener('change', function () {
    if (reduce.matches) texteSeul(); else demarrerSiPret();
  });

  /* Les métriques Poppins servent à prélèver le texte : on attend la police
     (avec un garde-fou de 2,5 s si Google Fonts est injoignable). */
  var fontesPretes = (document.fonts && document.fonts.load)
    ? Promise.race([
        document.fonts.load('700 100px "Poppins"'),
        new Promise(function (r) { setTimeout(r, 2500); })
      ]).catch(function () {})
    : Promise.resolve();

  fontesPretes.then(function () { pret = true; demarrerSiPret(); });
})();
