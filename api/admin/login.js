/* POST /api/admin/login — { email, password } → cookie de session */
'use strict';
const { json, configPret, tropDessais, reinitEssais, ipDe, memeChose, cookieSession, SESSION_MS } = require('../../lib/server.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, { erreur: 'Méthode non autorisée' }, 405);
  if (!configPret()) {
    return json(res, { erreur: 'Configuration d’administration manquante : vérifiez les variables ADMIN_EMAIL et ADMIN_PASSWORD du projet Vercel.' }, 503);
  }
  const ip = ipDe(req);
  if (tropDessais(ip)) return json(res, { erreur: 'Trop de tentatives, réessayez plus tard.' }, 429);
  const corps = (req.body && typeof req.body === 'object') ? req.body : {};
  const ok = memeChose(corps.email, process.env.ADMIN_EMAIL) && memeChose(corps.password, process.env.ADMIN_PASSWORD);
  if (!ok) return json(res, { erreur: 'E-mail ou mot de passe incorrect.' }, 401);
  reinitEssais(ip);
  const exp = Date.now() + SESSION_MS;
  res.setHeader('set-cookie', cookieSession(exp));
  json(res, { ok: true });
};
