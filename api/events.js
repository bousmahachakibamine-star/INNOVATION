/* GET /api/events — liste publique des événements */
'use strict';
const { json, lireEvents } = require('../lib/server.js');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return json(res, { erreur: 'Méthode non autorisée' }, 405);
  res.setHeader('cache-control', 'no-store');
  try {
    json(res, await lireEvents());
  } catch (e) {
    json(res, { erreur: 'Base indisponible : connectez le stockage KV au projet Vercel.' }, 503);
  }
};
