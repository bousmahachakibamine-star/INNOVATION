/* POST /api/admin/logout — invalide le cookie de session */
'use strict';
const { json, cookieSession } = require('../../lib/server.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, { erreur: 'Méthode non autorisée' }, 405);
  res.setHeader('set-cookie', cookieSession(null));
  json(res, { ok: true });
};
