/* ============================================================
   INNOVATION — Club scientifique de l'ESGN Kolea
   Worker Freebuff Sites : fichiers statiques + API d'administration
   - GET  /api/events                → liste publique des événements
   - POST /api/admin/login           → { email, password } → cookie de session
   - POST /api/admin/logout          → déconnexion
   - GET  /api/admin/me              → état de la session
   - POST /api/admin/events          → créer (authentifié)
   - PUT  /api/admin/events/:id      → modifier (authentifié)
   - DELETE /api/admin/events/:id    → supprimer (authentifié)
   Variables : env.DB (D1), env.ADMIN_EMAIL, env.ADMIN_PASSWORD,
               env.SESSION_SECRET (aléatoire, 32+ caractères).
   ============================================================ */

const SEED_EVENTS = [
  { day: '14', month: 'Novembre 2026', title: 'Workshop : de l’idée au projet business',
    desc: 'Atelier pratique en petit groupe pour transformer une idée en projet viable, avec un mentor.' },
  { day: '05', month: 'Décembre 2026', title: 'Formation : communication & réseaux sociaux',
    desc: 'Créer du contenu qui marque, soigner l’image d’un projet et animer les réseaux comme un pro.' },
  { day: '19', month: 'Décembre 2026', title: 'Rencontre interactive : pitch & networking',
    desc: 'Présenter ses projets devant un jury et échanger avec des intervenants du monde professionnel.' }
];

const COOKIE = 'innov_session';
const SESSION_MS = 12 * 60 * 60 * 1000;   // 12 h
const ESSAIS_MAX = 10;                    // tentatives de connexion…
const ESSAIS_FENETRE = 15 * 60 * 1000;    // …par IP et par 15 minutes

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers || {}) }
  });

/* ---------- Sessions signées (HMAC-SHA256, sans dépendance) ---------- */
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const te = new TextEncoder();

async function signe(exp, secret) {
  const key = await crypto.subtle.importKey('raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, te.encode('innov-admin:' + exp)));
}

async function sessionValide(cookieHeader, secret) {
  if (!cookieHeader || !secret) return false;
  const m = cookieHeader.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([0-9]+)\\.([0-9a-f]+)'));
  if (!m) return false;
  const exp = Number(m[1]);
  if (!exp || Date.now() > exp) return false;
  const attendu = await signe(exp, secret);
  if (attendu.length !== m[2].length) return false;
  let diff = 0;                              // comparaison « à temps constant »
  for (let i = 0; i < attendu.length; i++) diff |= attendu.charCodeAt(i) ^ m[2].charCodeAt(i);
  return diff === 0;
}

function memeChose(a, b) {
  const x = te.encode(String(a || '')), y = te.encode(String(b || ''));
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/* ---------- Base de données (D1) ---------- */
async function tablePrette(db) {
  await db.prepare(
    'CREATE TABLE IF NOT EXISTS events (' +
    'id TEXT PRIMARY KEY, day TEXT, month TEXT, title TEXT, desc TEXT, ' +
    'position INTEGER, created_at INTEGER)'
  ).run();
  await db.prepare(
    'CREATE TABLE IF NOT EXISTS login_tries (ip TEXT PRIMARY KEY, n INTEGER, reset INTEGER)'
  ).run();
  await db.prepare(
    'CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT)'
  ).run();
}

const cle = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

async function listeEvents(db) {
  await tablePrette(db);
  let rows = (await db.prepare('SELECT * FROM events ORDER BY position, created_at').all()).results;
  const initialisee = await db.prepare("SELECT value FROM app_state WHERE key = 'events_seeded'").first();
  if (!initialisee) {
    if (!rows.length) {                      // première visite : on installe les 3 exemples
      const ins = db.prepare('INSERT INTO events (id, day, month, title, desc, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (let i = 0; i < SEED_EVENTS.length; i++) {
        const e = SEED_EVENTS[i];
        await ins.bind(cle(), e.day, e.month, e.title, e.desc, i, Date.now()).run();
      }
    }
    await db.prepare("INSERT OR IGNORE INTO app_state (key, value) VALUES ('events_seeded', '1')").run();
    rows = (await db.prepare('SELECT * FROM events ORDER BY position, created_at').all()).results;
  }
  return rows.map(r => ({ id: r.id, day: r.day, month: r.month, title: r.title, desc: r.desc, position: r.position }));
}

async function tropDessais(db, ip) {
  await tablePrette(db);
  const r = await db.prepare('SELECT n, reset FROM login_tries WHERE ip = ?').bind(ip).first();
  if (!r || Date.now() > r.reset) {
    await db.prepare('INSERT INTO login_tries (ip, n, reset) VALUES (?, 1, ?) ON CONFLICT(ip) DO UPDATE SET n = 1, reset = excluded.reset')
      .bind(ip, Date.now() + ESSAIS_FENETRE).run();
    return false;
  }
  if (r.n >= ESSAIS_MAX) return true;
  await db.prepare('UPDATE login_tries SET n = n + 1 WHERE ip = ?').bind(ip).run();
  return false;
}

/* ---------- Entrée principale ---------- */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if ((url.pathname === '/admin' || url.pathname === '/admin/') &&
        (request.method === 'GET' || request.method === 'HEAD')) {
      const adminUrl = new URL('/admin/index.html', url);
      return env.ASSETS.fetch(new Request(adminUrl, request));
    }

    /* ----- API événements (publique) ----- */
    if (url.pathname === '/api/events' && request.method === 'GET') {
      try {
        return json(await listeEvents(env.DB));
      } catch (e) {
        return json({ erreur: 'base indisponible' }, { status: 503 });
      }
    }

    /* ----- API administration ----- */
    if (url.pathname.startsWith('/api/admin/')) {
      if (!env.DB) return json({ erreur: 'base non configurée' }, { status: 503 });
      const ip = request.headers.get('cf-connecting-ip') || 'inconnu';

      if (url.pathname === '/api/admin/login' && request.method === 'POST') {
        if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
          return json({ erreur: 'Administration pas encore configurée : identifiants à définir dans les secrets du site.' }, { status: 503 });
        }
        if (await tropDessais(env.DB, ip)) return json({ erreur: 'Trop de tentatives, réessayez plus tard.' }, { status: 429 });
        let corps = {};
        try { corps = await request.json(); } catch (e) { /* corps vide */ }
        const ok = env.ADMIN_EMAIL && env.ADMIN_PASSWORD && env.SESSION_SECRET &&
          memeChose(corps.email, env.ADMIN_EMAIL) && memeChose(corps.password, env.ADMIN_PASSWORD);
        if (!ok) return json({ erreur: 'E-mail ou mot de passe incorrect.' }, { status: 401 });
        await env.DB.prepare('DELETE FROM login_tries WHERE ip = ?').bind(ip).run(); // connexion réussie : on repart à zéro
        const exp = Date.now() + SESSION_MS;
        const jeton = exp + '.' + (await signe(exp, env.SESSION_SECRET));
        return json({ ok: true }, {
          headers: { 'set-cookie': `${COOKIE}=${jeton}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}` }
        });
      }

      if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
        return json({ ok: true }, { headers: { 'set-cookie': `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0` } });
      }

      const auth = await sessionValide(request.headers.get('cookie'), env.SESSION_SECRET);

      if (url.pathname === '/api/admin/me' && request.method === 'GET') {
        return json({ connecte: auth });
      }

      if (url.pathname === '/api/admin/events') {
        if (!auth) return json({ erreur: 'Non authentifié' }, { status: 401 });
        if (request.method === 'POST') {
          let c = {};
          try { c = await request.json(); } catch (e) { return json({ erreur: 'Corps invalide' }, { status: 400 }); }
          if (!c.title || !String(c.title).trim()) return json({ erreur: 'Titre obligatoire' }, { status: 400 });
          const max = await env.DB.prepare('SELECT COALESCE(MAX(position), -1) AS p FROM events').first();
          await env.DB.prepare('INSERT INTO events (id, day, month, title, desc, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(cle(), String(c.day || '').slice(0, 10), String(c.month || '').slice(0, 30),
              String(c.title).slice(0, 140), String(c.desc || '').slice(0, 400),
              (max && max.p != null ? max.p : -1) + 1, Date.now()).run();
          return json({ ok: true }, { status: 201 });
        }
      }

      const mEvent = url.pathname.match(/^\/api\/admin\/events\/([^/]+)$/);
      if (mEvent && (request.method === 'PUT' || request.method === 'DELETE')) {
        if (!auth) return json({ erreur: 'Non authentifié' }, { status: 401 });
        const id = mEvent[1];
        const ex = await env.DB.prepare('SELECT id FROM events WHERE id = ?').bind(id).first();
        if (!ex) return json({ erreur: 'Événement introuvable' }, { status: 404 });
        if (request.method === 'DELETE') {
          await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
          return json({ ok: true });
        }
        let c = {};
        try { c = await request.json(); } catch (e) { return json({ erreur: 'Corps invalide' }, { status: 400 }); }
        await env.DB.prepare('UPDATE events SET day = ?, month = ?, title = ?, desc = ? WHERE id = ?')
          .bind(String(c.day || '').slice(0, 10), String(c.month || '').slice(0, 30),
            String(c.title || '').slice(0, 140), String(c.desc || '').slice(0, 400), id).run();
        return json({ ok: true });
      }

      return json({ erreur: 'Route inconnue' }, { status: 404 });
    }

    /* ----- Le reste : fichiers statiques du site ----- */
    return env.ASSETS.fetch(request);
  }
};
