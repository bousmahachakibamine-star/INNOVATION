/* GET /api/admin/me — { connecte: booléen } */
'use strict';
const { json, sessionValide } = require('../../lib/server.js');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return json(res, { erreur: 'Méthode non autorisée' }, 405);
  json(res, { connecte: sessionValide(req.headers.cookie) });
};
