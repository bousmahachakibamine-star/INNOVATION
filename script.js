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
  var sectionIds = ['hero', 'membres', 'evenements', 'reseaux'];
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
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = ((i % 4) * 90) + 'ms';
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- Départements : panneau photo + texte ---------- */
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

    function openDept(key, trigger) {
      var d = DEPTS[key];
      if (!d) return;
      lastTrigger = trigger || null;
      deptTitle.textContent = d.title;
      deptDesc.textContent = d.desc;
      deptResp.textContent = d.resp;
      deptLabel.textContent = d.label;
      /* Photo du responsable : affichée si le fichier existe, sinon le logo reste */
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
      if ((e.key === 'Escape' || e.key === 'Esc') && !overlay.hidden) closeDept();
    });
  }

  /* ---------- Année du pied de page ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
