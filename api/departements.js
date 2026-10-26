/* GET /api/departements — responsable et photo de chaque département (public) */
'use strict';
const { json, lireDepartements } = require('../lib/server.js');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return json(res, { erreur: 'Méthode non autorisée' }, 405);
  res.setHeader('cache-control', 'no-store');
  try {
    json(res, await lireDepartements());
  } catch (e) {
    json(res, { erreur: 'Base indisponible.' }, 503);
  }
};
