/* PUT /api/admin/events/:id — modifier, DELETE — supprimer (authentifié) */
'use strict';
const { json, sessionValide, lireEvents, ecrireEvents } = require('../../../lib/server.js');

module.exports = async (req, res) => {
  const methode = req.method;
  if (methode !== 'PUT' && methode !== 'DELETE') return json(res, { erreur: 'Méthode non autorisée' }, 405);
  if (!sessionValide(req.headers.cookie)) return json(res, { erreur: 'Non authentifié' }, 401);
  const id = String(req.query && req.query.id ? req.query.id : '');
  try {
    const liste = await lireEvents();
    const i = liste.findIndex(e => String(e.id) === id);
    if (i < 0) return json(res, { erreur: 'Événement introuvable' }, 404);
    if (methode === 'DELETE') {
      liste.splice(i, 1);
      await ecrireEvents(liste);
      return json(res, { ok: true });
    }
    let c = {};
    try { c = (req.body && typeof req.body === 'object') ? req.body : JSON.parse(req.body || '{}'); } catch (e) { return json(res, { erreur: 'Corps invalide' }, 400); }
    liste[i] = Object.assign({}, liste[i], {
      day: String(c.day || '').slice(0, 10),
      month: String(c.month || '').slice(0, 30),
      title: String(c.title || liste[i].title).slice(0, 140),
      desc: String(c.desc || '').slice(0, 400)
    });
    await ecrireEvents(liste);
    json(res, { ok: true });
  } catch (e) {
    json(res, { erreur: 'Stockage indisponible.' }, 503);
  }
};
