/* POST /api/admin/events — créer un événement (authentifié) */
'use strict';
const { json, sessionValide, lireEvents, ecrireEvents, cle } = require('../../lib/server.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, { erreur: 'Méthode non autorisée' }, 405);
  if (!sessionValide(req.headers.cookie)) return json(res, { erreur: 'Non authentifié' }, 401);
  let c = {};
  try { c = (req.body && typeof req.body === 'object') ? req.body : JSON.parse(req.body || '{}'); } catch (e) { return json(res, { erreur: 'Corps invalide' }, 400); }
  if (!c.title || !String(c.title).trim()) return json(res, { erreur: 'Titre obligatoire' }, 400);
  try {
    const liste = await lireEvents();
    const maxPos = liste.reduce((m, e) => Math.max(m, typeof e.position === 'number' ? e.position : -1), -1);
    liste.push({
      id: cle(),
      day: String(c.day || '').slice(0, 10),
      month: String(c.month || '').slice(0, 30),
      title: String(c.title).slice(0, 140),
      desc: String(c.desc || '').slice(0, 400),
      position: maxPos + 1
    });
    await ecrireEvents(liste);
    json(res, { ok: true }, 201);
  } catch (e) {
    json(res, { erreur: 'Stockage indisponible.' }, 503);
  }
};
