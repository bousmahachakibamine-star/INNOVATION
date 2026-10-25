/* ============================================================
   INNOVATION — logique commune du backend d'administration
   (fonctions serveur Vercel du dossier /api).
   Stockage : KV Vercel (Upstash) via KV_REST_API_URL / KV_REST_API_TOKEN.
   Variables : ADMIN_EMAIL, ADMIN_PASSWORD (+ SESSION_SECRET conseillé).
   ============================================================ */
'use strict';
const crypto = require('crypto');

const COOKIE = 'innov_session';
const SESSION_MS = 12 * 60 * 60 * 1000;   // 12 h
const ESSAIS_MAX = 10;                    // tentatives de connexion…
const ESSAIS_FENETRE = 15 * 60 * 1000;    // …par IP et par 15 minutes
const CLE_EVENTS = 'innov:events';

const SEED_EVENTS = [
  { day: '14', month: 'Novembre 2026', title: 'Workshop : de l’idée au projet business',
    desc: 'Atelier pratique en petit groupe pour transformer une idée en projet viable, avec un mentor.' },
  { day: '05', month: 'Décembre 2026', title: 'Formation : communication & réseaux sociaux',
    desc: 'Créer du contenu qui marque, soigner l’image d’un projet et animer les réseaux comme un pro.' },
  { day: '19', month: 'Décembre 2026', title: 'Rencontre interactive : pitch & networking',
    desc: 'Présenter ses projets devant un jury et échanger avec des intervenants du monde professionnel.' }
];

function json(res, data, status) {
  res.statusCode = status || 200;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

/* ---------- Sessions signées (HMAC-SHA256) ---------- */
function secretSession() {
  // À défaut de SESSION_SECRET dédié, la signature réutilise le mot de passe
  // d'administration — c'est déjà un secret, jamais exposé au client.
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}
function configPret() {
  return !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && secretSession());
}
function signe(exp) {
  return crypto.createHmac('sha256', secretSession()).update('innov-admin:' + exp).digest('hex');
}
function sessionValide(cookieHeader) {
  if (!cookieHeader) return false;
  const m = cookieHeader.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([0-9]+)\\.([0-9a-f]+)'));
  if (!m) return false;
  const exp = Number(m[1]);
  if (!exp || Date.now() > exp) return false;
  const attendu = Buffer.from(signe(exp), 'utf8'), recu = Buffer.from(m[2], 'utf8');
  if (attendu.length !== recu.length) return false;
  return crypto.timingSafeEqual(attendu, recu);
}
function memeChose(a, b) {
  const x = Buffer.from(String(a || ''), 'utf8'), y = Buffer.from(String(b || ''), 'utf8');
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}
function cookieSession(exp) {
  return exp == null
    ? COOKIE + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
    : COOKIE + '=' + exp + '.' + signe(exp) + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + SESSION_MS / 1000;
}

/* ---------- Limitation des tentatives (mémoire de l'instance) ---------- */
const essais = new Map();
function tropDessais(ip) {
  const maintenant = Date.now();
  const e = essais.get(ip);
  if (!e || maintenant > e.reset) { essais.set(ip, { n: 1, reset: maintenant + ESSAIS_FENETRE }); return false; }
  if (e.n >= ESSAIS_MAX) return true;
  e.n += 1;
  return false;
}
function reinitEssais(ip) { essais.delete(ip); }
function ipDe(req) {
  return req.headers['x-real-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnu';
}

/* ---------- Stockage : KV Vercel (API REST Upstash) ---------- */
/* Vercel nomme parfois les variables avec le préfixe du projet
   (innovationclub_KV_REST_API_URL…) quand elles viennent de l'intégration
   Storage : on accepte les deux formes, mais jamais un token en lecture
   seule pour les écritures. */
function envKV(nom) {
  if (process.env[nom]) return process.env[nom];
  const trouve = Object.keys(process.env).find(function (n) {
    return n.endsWith(nom) && n.indexOf('READ_ONLY') === -1;
  });
  return trouve ? process.env[trouve] : '';
}

async function kv(cmds) {
  const url = envKV('KV_REST_API_URL'), token = envKV('KV_REST_API_TOKEN');
  if (!url || !token) throw new Error('stockage-non-configure');
  const r = await fetch(url, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('kv-' + r.status);
  return r.json();
}

const cle = () => crypto.randomUUID();

async function lireEvents() {
  const r = await kv(['GET', CLE_EVENTS]);
  if (r && r.result) { try { return JSON.parse(r.result); } catch (e) { /* JSON illisible : on repart du seed */ } }
  const grille = SEED_EVENTS.map(function (e, i) {
    return { id: cle(), day: e.day, month: e.month, title: e.title, desc: e.desc, position: i };
  });
  await kv(['SET', CLE_EVENTS, JSON.stringify(grille)]);
  return grille;
}
async function ecrireEvents(liste) {
  await kv(['SET', CLE_EVENTS, JSON.stringify(liste)]);
}

module.exports = {
  json, configPret, sessionValide, memeChose, cookieSession,
  tropDessais, reinitEssais, ipDe, lireEvents, ecrireEvents, cle, SESSION_MS, envKV
};
