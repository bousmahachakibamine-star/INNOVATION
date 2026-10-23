/* ============================================================
   INNOVATION — Club scientifique de l'ESGN Kolea
   Script du site : menu mobile, lien actif au défilement,
   en-tête ombré et apparition douce des sections.
   (La bannière héros a son propre script dans index.html.)
   ============================================================ */

(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  var navLinks = document.querySelectorAll('.nav-link');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menu mobile ---------- */
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Ouvrir le menu');
      });
    });
  }

  /* ---------- En-tête ombré + lien actif selon le défilement ---------- */
  var sectionIds = ['hero', 'membres', 'evenements', 'galerie', 'reseaux'];
  var sections = sectionIds
    .map(function (id) { return { id: id, el: document.getElementById(id) }; })
    .filter(function (s) { return s.el; });

  var ticking = false;
  function updateScrollState() {
    ticking = false;
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('scrolled', y > 30);

    var probe = y + (header ? header.offsetHeight : 0) + 100;
    var current = sections.length ? sections[0].id : null;
    sections.forEach(function (s) {
      if (s.el.offsetTop <= probe) current = s.id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScrollState);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateScrollState();

  /* ---------- Apparition douce des sections ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  var revealObserver = null;   /* réutilisé pour les cartes ajoutées via l'API */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = ((i % 4) * 90) + 'ms';
    });
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- Événements : affichés depuis l'API d'administration ----------
     Les trois événements d'exemple restent aussi dans le HTML (repli si
     l'API est indisponible). Ceux ajoutés/modifiés dans /admin apparaissent
     ici automatiquement, avec la même mise en page et la même animation. */
  var eventsList = document.querySelector('.events-list');
  if (eventsList) {
    fetch('/api/events', { headers: { 'accept': 'application/json' } })
      .then(function (rep) { if (!rep.ok) throw new Error('api'); return rep.json(); })
      .then(function (evts) {
        if (!Array.isArray(evts)) return;
        eventsList.textContent = '';
        if (!evts.length) {
          var empty = document.createElement('p');
          empty.className = 'events-empty';
          empty.textContent = 'Aucun événement à venir pour le moment.';
          eventsList.appendChild(empty);
          return;
        }
        evts.forEach(function (e) {
          var card = document.createElement('article');
          card.className = 'event-card reveal';
          card.innerHTML = '<span class="event-date" aria-hidden="true">'
            + '<span class="day"></span><span class="month"></span></span>'
            + '<div class="event-body"><h4></h4><p></p></div>';
          card.querySelector('.day').textContent = e.day || '';
          card.querySelector('.month').textContent = e.month || '';
          card.querySelector('h4').textContent = e.title || '';
          card.querySelector('p').textContent = e.desc || '';
          eventsList.appendChild(card);
          if (revealObserver) {
            card.style.transitionDelay = ((eventsList.children.length % 4) * 90) + 'ms';
            revealObserver.observe(card);
          } else {
            card.classList.add('visible');
          }
        });
      })
      .catch(function () { /* API absente : on garde les événements du HTML */ });
  }

  /* ---------- Départements : panneau photo + texte ---------- */
  /* Les photos et vidéos du club vivent dans la Galerie (#galerie), juste en dessous. */
  var DEPTS = {
    re: {
      title: 'RE — Relation externe',
      label: 'RE',
      resp: 'Bousmaha Chakib Amine',
      photo: 'photos/re.jpg',
      desc: "Le département Relation externe assure le lien entre Innovation et les autres clubs, les partenaires et les instances de l'école : invitations, collaborations et représentation du club à l'extérieur."
    },
    rh: {
      title: 'RH — Ressources humaines',
      label: 'RH',
      resp: 'Zenati Aya',
      photo: 'photos/rh.jpg',
      desc: "Le département Ressources humaines accompagne les membres, gère les recrutements et veille au bon esprit d'équipe au sein du club."
    },
    media: {
      title: 'Média',
      label: 'MÉDIA',
      resp: 'Nait Mohamed Amani',
      photo: 'photos/media.jpg',
      desc: "Le département Média réalise les photos, vidéos et publications du club et met en valeur nos événements sur nos réseaux sociaux."
    },
    formation: {
      title: 'Formation',
      label: 'FORM.',
      resp: 'Baha Eddine Benhaj Taher',
      photo: 'photos/formation.jpg',
      desc: "Le département Formation organise les ateliers et l'entraide : tutoriels, sessions pratiques et accompagnement des nouveaux membres."
    }
  };

  /* ============================================================
     GALERIE DU SITE — toutes les photos & vidéos du club (#galerie)
     ============================================================ */
  /* Ajouter un média : déposez le fichier dans gallery/media/ puis ajoutez une
     ligne ci-dessous. w/h = dimensions réelles du fichier (évite les sauts de
     mise en page) ; poster = image d'aperçu d'une vidéo (facultatif).
     Les vidéos listées dans RUBAN_ROWS défilent aussi en ruban infini. */
  var SITE_MEDIA = [
    { src: 'gallery/media/photo-4786.jpg', w: 1600, h: 900, caption: 'Iftar Ramadan Kareem - Innovation' },
    { type: 'video', src: 'gallery/media/wamda-officiel.mp4', w: 1276, h: 720, poster: 'gallery/media/poster-wamda-officiel.jpg', caption: 'Wamda - Innovation Recap' },
    { src: 'gallery/media/photo-7238.jpg', w: 1600, h: 2133, caption: 'En équipe, lors de l’événement' },
    { type: 'video', src: 'gallery/media/recap-smart-se.mp4', w: 540, h: 960, poster: 'gallery/media/poster-recap-smart-se.jpg', caption: 'Recap de notre collaboration @smart_se' },
    { src: 'gallery/media/photo-8896.jpg', w: 1600, h: 900, caption: 'Open Day Innovation 2026' },
    { type: 'video', src: 'gallery/media/conf-smartplus.mp4', w: 848, h: 480, poster: 'gallery/media/poster-conf-smartplus.jpg', caption: 'Innovation dans Excel Expo' },
    { type: 'video', src: 'gallery/media/clip-tiktok-1.mp4', w: 720, h: 406, poster: 'gallery/media/poster-clip-tiktok-1.jpg', caption: 'Hanawladha - Innovation' },
    { type: 'video', src: 'gallery/media/clip-tiktok-2.mp4', w: 854, h: 480, poster: 'gallery/media/poster-clip-tiktok-2.jpg', caption: 'Iftar 2026' }
  ];
  var currentGallery = SITE_MEDIA;

  /* ---------- Visionneuse plein écran (lightbox) ---------- */
  var lightbox = document.getElementById('lightbox');
  var lbMedia = document.getElementById('lightboxMedia');
  var lbCaption = document.getElementById('lightboxCaption');
  var lbCount = document.getElementById('lightboxCount');
  var lbIndex = 0;
  var lbLastFocus = null;

  function renderLightbox() {
    var item = currentGallery[lbIndex];
    if (!item || !lbMedia) return;
    lbMedia.innerHTML = '';
    if (item.type === 'video') {
      var vid = document.createElement('video');
      vid.src = item.src;
      if (item.poster) vid.poster = item.poster;
      vid.controls = true;
      vid.playsInline = true;
      vid.autoplay = true;
      lbMedia.appendChild(vid);
    } else {
      var img = document.createElement('img');
      img.src = item.src;
      img.alt = item.caption || '';
      lbMedia.appendChild(img);
    }
    if (lbCaption) lbCaption.textContent = item.caption || '';
    if (lbCount) lbCount.textContent = (lbIndex + 1) + ' / ' + currentGallery.length;
  }

  function openLightbox(i) {
    if (!lightbox || !currentGallery.length) return;
    lbIndex = i;
    lbLastFocus = document.activeElement;
    renderLightbox();
    lightbox.hidden = false;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        lightbox.classList.add('open');
        var lbClose = document.getElementById('lightboxClose');
        if (lbClose) lbClose.focus();
      });
    });
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.classList.remove('open');
    if (lbMedia) lbMedia.innerHTML = ''; // coupe la lecture d'une vidéo
    window.setTimeout(function () {
      lightbox.hidden = true;
      if (lbLastFocus && lbLastFocus.focus) { lbLastFocus.focus(); lbLastFocus = null; }
    }, 250);
  }

  function stepLightbox(delta) {
    if (!currentGallery.length) return;
    lbIndex = (lbIndex + delta + currentGallery.length) % currentGallery.length;
    renderLightbox();
  }

  var lbCloseBtn = document.getElementById('lightboxClose');
  var lbPrevBtn = document.getElementById('lightboxPrev');
  var lbNextBtn = document.getElementById('lightboxNext');
  var lbBackdrop = document.getElementById('lightboxBackdrop');
  if (lightbox && lbCloseBtn && lbPrevBtn && lbNextBtn) {
    lbCloseBtn.addEventListener('click', closeLightbox);
    lbPrevBtn.addEventListener('click', function () { stepLightbox(-1); });
    lbNextBtn.addEventListener('click', function () { stepLightbox(1); });
    if (lbBackdrop) lbBackdrop.addEventListener('click', closeLightbox);
  }

  /* ---------- Grille de la galerie (photos + vidéos) ---------- */
  var mediaGrid = document.getElementById('mediaGrid');
  var mediaEmpty = document.getElementById('mediaEmpty');
  if (mediaGrid) {
    SITE_MEDIA.forEach(function (item, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'media-card';
      btn.setAttribute('aria-label', 'Ouvrir : ' + (item.caption || 'média ' + (i + 1)));
      var media;
      if (item.type === 'video') {
        media = document.createElement('video');
        media.src = item.src;
        if (item.poster) media.poster = item.poster;
        media.muted = true;
        media.playsInline = true;
        media.preload = 'none'; // la vignette = le poster, la vidéo ne charge qu'au clic
        var badge = document.createElement('span');
        badge.className = 'media-play';
        badge.textContent = '▶';
        btn.appendChild(badge);
      } else {
        media = document.createElement('img');
        media.src = item.src;
        media.alt = item.caption || '';
        media.loading = 'lazy';
      }
      if (item.w) { media.setAttribute('width', item.w); media.setAttribute('height', item.h); }
      btn.appendChild(media);
      var cap = document.createElement('span');
      cap.className = 'media-cap';
      cap.textContent = item.caption || '';
      btn.appendChild(cap);
      btn.addEventListener('click', function () { openLightbox(i); });
      mediaGrid.appendChild(btn);
    });
    if (mediaEmpty) mediaEmpty.hidden = SITE_MEDIA.length > 0;
  }

  /* ---------- Rubans infinis (vidéos qui défilent en boucle) ---------- */
  /* Chaque vidéo apparaît 2 fois (le groupe se répète → boucle invisible).
     Piste 1 : les 3 vidéos de l'événement ; piste 2 : aftermovie + recap,
     en sens inverse. */
  var RUBAN_ROWS = [
    { id: 'piste1', n: 3, srcs: ['gallery/media/conf-smartplus.mp4', 'gallery/media/clip-tiktok-1.mp4', 'gallery/media/clip-tiktok-2.mp4'] },
    { id: 'piste2', n: 2, srcs: ['gallery/media/wamda-officiel.mp4', 'gallery/media/recap-smart-se.mp4'] }
  ];
  var rubanVideos = [];
  RUBAN_ROWS.forEach(function (row) {
    var piste = document.getElementById(row.id);
    if (!piste) return;
    piste.style.setProperty('--n', row.n);
    for (var rep = 0; rep < 2; rep++) {
      row.srcs.forEach(function (src) {
        var slot = document.createElement('div');
        slot.className = 'ruban-slot';
        var vid = document.createElement('video');
        vid.className = 'ruban-video';
        vid.src = src;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.preload = 'metadata';
        var item = null;
        for (var s = 0; s < SITE_MEDIA.length; s++) {
          if (SITE_MEDIA[s].src === src) { item = SITE_MEDIA[s]; break; }
        }
        if (item) {
          if (item.poster) vid.poster = item.poster;
          var idx = SITE_MEDIA.indexOf(item);
          vid.addEventListener('click', function () { openLightbox(idx); });
        }
        slot.appendChild(vid);
        piste.appendChild(slot);
        rubanVideos.push(vid);
      });
    }
  });
  /* On ne lit les rubans que lorsqu'ils sont visibles (économie CPU/batterie) */
  var rubansBox = document.getElementById('rubans');
  function setRubans(playing) {
    rubanVideos.forEach(function (v) {
      var rub = v.closest ? v.closest('.ruban') : null;
      if (rub && rub.offsetParent === null) { v.pause(); return; } // rangée masquée : jamais lue
      if (playing) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else v.pause();
    });
  }
  if (rubansBox && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { setRubans(en.isIntersecting); });
    }, { threshold: 0.05 }).observe(rubansBox);
  } else {
    setRubans(true);
  }

  var overlay = document.getElementById('deptOverlay');
  if (overlay) {
    var deptTitle = document.getElementById('deptTitle');
    var deptDesc = document.getElementById('deptDesc');
    var deptResp = document.getElementById('deptResp');
    var deptLabel = document.getElementById('deptPhotoLabel');
    var deptPhoto = document.getElementById('deptPhotoImg');
    var deptPlaceholder = document.getElementById('deptPhotoPlaceholder');
    var closeBtn = document.getElementById('deptClose');
    var joinLink = document.getElementById('deptJoin');
    var lastTrigger = null;
    var closeTimer = null;

    /* ---------- Écriture en direct (machine à écrire) ---------- */
    var typeTimers = [];
    function clearTyping() { typeTimers.forEach(clearTimeout); typeTimers = []; }
    function typeText(el, text, speed, done) {
      if (!el) { if (done) done(); return; }
      if (reduceMotion || !text) { el.textContent = text || ''; if (done) done(); return; }
      el.textContent = '';
      var i = 0;
      (function step() {
        el.textContent = text.slice(0, ++i);
        if (i < text.length) typeTimers.push(setTimeout(step, speed));
        else if (done) done();
      })();
    }
    /* Titre, puis responsable, puis description s'écrivent à l'ouverture du panneau */
    function typeDeptText(d) {
      clearTyping();
      /* On vide tout de suite : rien de l'ancien département ne doit clignoter */
      if (deptResp) deptResp.textContent = '';
      if (deptDesc) deptDesc.textContent = '';
      typeText(deptTitle, d.title, 26, function () {
        typeText(deptResp, d.resp, 14, function () {
          typeText(deptDesc, d.desc, 8);
        });
      });
    }

    function openDept(key, trigger) {
      var d = DEPTS[key];
      if (!d) return;
      lastTrigger = trigger || null;
      deptLabel.textContent = d.label;
      typeDeptText(d); // titre → responsable → description s'écrivent en direct
      if (deptPhoto) {
        if (deptPlaceholder) deptPlaceholder.hidden = false;
        deptPhoto.hidden = true;
        deptPhoto.alt = 'Photo du responsable — ' + d.title;
        if (d.photo) {
          deptPhoto.src = d.photo;
          if (deptPhoto.complete && deptPhoto.naturalWidth > 0) {
            deptPhoto.hidden = false;
            if (deptPlaceholder) deptPlaceholder.hidden = true;
          }
        }
      }
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      overlay.hidden = false;
      document.body.style.overflow = 'hidden'; // bloque le défilement de la page derrière
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          overlay.classList.add('open');
          closeBtn.focus();
        });
      });
    }

    function closeDept() {
      clearTyping(); // Stoppe l'écriture en direct si on ferme avant la fin
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      closeTimer = setTimeout(function () {
        overlay.hidden = true;
        if (lastTrigger) { lastTrigger.focus(); lastTrigger = null; }
      }, 340);
    }

    /* Si la photo du responsable n'existe pas (encore), on réaffiche le bloc logo */
    if (deptPhoto) {
      deptPhoto.addEventListener('error', function () {
        deptPhoto.hidden = true;
        if (deptPlaceholder) deptPlaceholder.hidden = false;
      });
      deptPhoto.addEventListener('load', function () {
        deptPhoto.hidden = false;
        if (deptPlaceholder) deptPlaceholder.hidden = true;
      });
    }

    document.querySelectorAll('.dept-card').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openDept(btn.getAttribute('data-dept'), btn);
      });
    });
    closeBtn.addEventListener('click', closeDept);
    joinLink.addEventListener('click', closeDept);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeDept(); // clic sur le fond
    });
    document.addEventListener('keydown', function (e) {
      /* La visionneuse a la priorité sur le panneau du département */
      if (lightbox && !lightbox.hidden) {
        if (e.key === 'Escape' || e.key === 'Esc') { closeLightbox(); return; }
        if (e.key === 'ArrowLeft') { stepLightbox(-1); return; }
        if (e.key === 'ArrowRight') { stepLightbox(1); return; }
        return;
      }
      if ((e.key === 'Escape' || e.key === 'Esc') && !overlay.hidden) closeDept();
    });
  }

  /* ============================================================
     MASCOTTE — le petit logo du club qui explore librement la page,
     piloté par le défilement : il glisse, plonge en piqué, fait un
     looping puis sort par un bord et réapparaît de l'autre côté.
     Une traînée de copies suit la tête, et une bulle de parole
     s'écrit en direct selon l'endroit de la page (voir BULLES).
     Au repos (aucun défilement), la boucle s'endort pour ne rien
     consommer et se relance au prochain mouvement.
     ============================================================ */
  var mascotte = document.getElementById('mascotte');
  if (mascotte) {
    var M_LOGO = 'mascot-logo.png';
    var petitEcran = window.innerWidth < 700;
    var M_TAILLE = petitEcran ? 42 : 54;  // plus petit sur téléphone
    var M_N = petitEcran ? 4 : 9;         // traînée réduite sur téléphone (moins de calques)
    var mTailles = [], mImgs = [];
    for (var m = M_N; m >= 0; m--) {   // traînée d'abord, la tête (classe .tete) au-dessus
      var mImg = new Image();
      mImg.src = M_LOGO;
      mImg.alt = '';
      var mT = M_TAILLE - m * (M_TAILLE / 22);
      mTailles[m] = mT;
      mImg.style.width = mT + 'px';
      mImg.style.height = mT + 'px';
      if (m === 0) { mImg.className = 'tete'; }
      else { mImg.style.opacity = reduceMotion ? '0' : (0.38 * (1 - m / M_N)).toFixed(2); }
      mascotte.appendChild(mImg);
      mImgs[m] = mImg;
    }
    var M_MARGE = 16;
    var mEcran = function (x) {           // sort d'un bord, réapparaît de l'autre
      var L = window.innerWidth + M_TAILLE * 2;
      return ((x + M_TAILLE) % L + L) % L - M_TAILLE;
    };
    var M_CYCLES = 2;                     // parcours complets sur toute la page
    var mPos = [];
    for (var s2 = 0; s2 <= M_N; s2++) {
      mPos.push({ x: window.innerWidth - M_MARGE - M_TAILLE, y: window.innerHeight * 0.30 });
    }
    var mCible = { x: mPos[0].x, y: mPos[0].y, rot: 0 };

    /* ---------- Bulles de parole ----------
       Les intervalles suivent les phases du trajet de la mascotte, exprimées
       dans le même avancement de page que celui qui pilote son animation. */
    var BULLES = [
      { texte: 'Salut, bienvenue au club 👋 Clique sur le logo du club 👀', de: 0, a: 0.11 },
      { texte: 'Voici notre bureau, pas mal non ?', de: 0.11, a: 0.26 },
      { texte: 'Nos départements, là où tout se joue !', de: 0.26, a: 0.35 },
      { texte: 'Nos événements, on a hâte de vous y voir 🔥', de: 0.35, a: 0.40 },
      { texte: 'Byeeee !', de: 0.40, a: 0.50 },
      { texte: 'T’as vraiment pensé que j’allais partir si tôt ?', de: 0.50, a: 0.61 },
      { texte: 'INNOVATION, tout simplement notre famille', de: 0.61, a: 0.85 },
      { texte: 'Découvrez-nous, soyez un membre de notre famille', de: 0.85, a: 1.01 }
    ];
    var VITESSE_TEXTE = 35;   // millisecondes par lettre
    function mFrac(px) {                 // px → avancement du défilement (0 → 1)
      var hs = document.documentElement.scrollHeight - window.innerHeight;
      return hs > 0 ? px / hs : 0;
    }
    var mBulleYmin = 8;   // la bulle ne passe jamais sous l'en-tête
    function mCalculeBulleYmin() {
      var entete = document.querySelector('.site-header');
      mBulleYmin = (entete ? entete.offsetHeight : 74) + 16;
    }
    mCalculeBulleYmin();

    /* La bulle : choix, écriture lettre par lettre, placement près de la tête */
    var bulle = document.createElement('div');
    bulle.id = 'bulle';
    bulle.setAttribute('aria-hidden', 'true');
    bulle.innerHTML = '<span class="fantome"></span><span class="ecrit"></span>';
    document.body.appendChild(bulle);
    var elFantome = bulle.children[0], elEcrit = bulle.children[1];
    var bIdx = -2, bT0 = 0, bN = -1, bW = 0, bH = 0;
    function bLettres(j) { return j >= 0 ? Array.from(BULLES[j].texte) : []; }
    function bEcritEnCours() { return bIdx >= 0 && bN < bLettres(bIdx).length; }

    function mBulle() {
      var p = mFrac(window.scrollY);
      var i = -1;
      BULLES.forEach(function (b, j) { if (p >= b.de && p < b.a) i = j; });
      if (i !== bIdx) {                    // changement : on repart de zéro
        bIdx = i; bT0 = performance.now(); bN = -1;
        elEcrit.textContent = '';
        elFantome.textContent = i >= 0 ? BULLES[i].texte : '';
        bW = bulle.offsetWidth; bH = bulle.offsetHeight; // mesure une seule fois par bulle
      }
      if (i < 0) { bulle.style.opacity = 0; return; }
      var lettres = bLettres(i);
      var n = reduceMotion ? lettres.length
        : Math.min(lettres.length, Math.floor((performance.now() - bT0) / VITESSE_TEXTE));
      if (n !== bN) { bN = n; elEcrit.textContent = lettres.slice(0, n).join(''); }

      var W = window.innerWidth, hx = mEcran(mPos[0].x), hy = mPos[0].y;
      var adroite = hx < W / 2 - M_TAILLE / 2; // logo à gauche : bulle à sa droite, et inversement
      var x = adroite ? hx + M_TAILLE + 10 : hx - bW - 10;
      x = Math.max(8, Math.min(W - bW - 8, x));
      var y = Math.max(mBulleYmin, hy - bH + 20);
      bulle.classList.toggle('inverse', !adroite);
      bulle.style.opacity = (hx > -M_TAILLE / 2 && hx < W - M_TAILLE / 2) ? 1 : 0; // cachée si le logo est hors écran
      bulle.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }

    function mCalculeCible() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? window.scrollY / h : 0;
      var W = window.innerWidth, H = window.innerHeight, L = W + M_TAILLE * 2;
      var q = p * M_CYCLES;
      var k = Math.min(Math.floor(q), M_CYCLES - 1); // numéro du parcours
      var t = q - k;                                  // avancement (0 → 1)
      var yHaut = H * 0.30, yBas = H * 0.56, ySortie = H * 0.72;
      var r = Math.min(46, W * 0.09);                 // rayon du looping
      var xv = W * (k % 2 ? 0.62 : 0.3) - r;          // colonne de la descente
      var ease = function (u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; };
      var x, y, rot = 0;
      if (t < 0.22) {                                 // 1. glisse vers la colonne
        var u1 = 1 - (1 - t / 0.22) * (1 - t / 0.22);
        var x0 = k === 0 ? W - M_TAILLE - M_MARGE : W + M_TAILLE;
        var y0 = k === 0 ? yHaut : ySortie;
        x = x0 + (xv - x0) * u1;
        y = y0 + (yHaut - y0) * ease(u1);
      } else if (t < 0.52) {                          // 2. plongée en piqué
        var u2 = (t - 0.22) / 0.30;
        x = xv;
        y = yHaut + (yBas - yHaut) * u2 * u2;
      } else if (t < 0.70) {                          // 3. petit looping
        var u3 = (t - 0.52) / 0.18;
        var th = Math.PI - u3 * 2 * Math.PI;
        x = xv + r + r * Math.cos(th);
        y = yBas + r * Math.sin(th);
        rot = -u3 * 360;
      } else {                                        // 4. repart et sort par le bord
        var u4 = Math.pow((t - 0.70) / 0.30, 1.4);
        x = xv * (1 - u4 * u4) + (-M_TAILLE) * u4 * u4;
        y = yBas * (1 - u4) * (1 - u4) + ySortie * (2 * (1 - u4) * u4 + u4 * u4);
      }
      mCible.x = x - k * L;                            // position « virtuelle » continue
      mCible.y = y + Math.sin(window.scrollY / 70) * 6 - M_TAILLE / 2;
      mCible.rot = rot;
    }

    /* Au repos (défilement stabilisé, texte fini), la boucle s'endort : zéro CPU.
       Le moindre défilement ou redimensionnement la relance. */
    var mActif = true, mDernierMouvement = 0;
    function mReveiller() {
      mDernierMouvement = Date.now();
      if (!mActif) { mActif = true; requestAnimationFrame(mBoucle); }
    }
    window.addEventListener('scroll', mReveiller, { passive: true });
    window.addEventListener('resize', function () { mCalculeBulleYmin(); mReveiller(); });
    window.addEventListener('load', function () { mCalculeBulleYmin(); mReveiller(); });
    window.setTimeout(function () { mCalculeBulleYmin(); mReveiller(); }, 900); // après polices/images

    function mBoucle() {
      mCalculeCible();
      var kk = reduceMotion ? 1 : 0.2;
      mPos[0].x += (mCible.x - mPos[0].x) * kk;
      mPos[0].y += (mCible.y - mPos[0].y) * kk;
      for (var i2 = 1; i2 <= M_N; i2++) {
        var a2 = mPos[i2 - 1], b2 = mPos[i2], f = reduceMotion ? 1 : 0.28;
        b2.x += (a2.x - b2.x) * f;
        b2.y += (a2.y - b2.y) * f;
      }
      var tilt = Math.max(-15, Math.min(15, (mCible.x - mPos[0].x) * 0.12)) + mCible.rot;
      for (var j2 = 0; j2 <= M_N; j2++) {
        var off = (M_TAILLE - mTailles[j2]) / 2;
        if (j2 > 0 && !reduceMotion) {
          var d2 = Math.sqrt(Math.pow(mPos[0].x - mPos[j2].x, 2) + Math.pow(mPos[0].y - mPos[j2].y, 2));
          mImgs[j2].style.opacity = (0.38 * (1 - j2 / M_N) * Math.min(1, d2 / 40)).toFixed(2);
        }
        mImgs[j2].style.transform = 'translate3d(' + (mEcran(mPos[j2].x) + off) + 'px,'
          + (mPos[j2].y + off) + 'px,0)'
          + (j2 === 0 ? ' rotate(' + tilt + 'deg)' : '');
      }
      mBulle();
      var auRepos = !bEcritEnCours()
        && Math.abs(mCible.x - mPos[0].x) < 0.8 && Math.abs(mCible.y - mPos[0].y) < 0.8
        && (Date.now() - mDernierMouvement) > 900;
      if (auRepos) { mActif = false; return; }
      requestAnimationFrame(mBoucle);
    }
    mCalculeBulleYmin();
    mBoucle();
  }

  /* ---------- Année du pied de page ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
