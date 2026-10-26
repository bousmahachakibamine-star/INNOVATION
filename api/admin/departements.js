/* PUT /api/admin/departements — changer le responsable (nom + photo) d'un
   département (authentifié). La photo arrive en data-URL image déjà
   redimensionnée par le navigateur (voir admin/index.html). */
'use strict';
const { json, sessionValide, lireDepartements, ecrireDepartement, CLES_DEPTS } = require('../../lib/server.js');

const PHOTO_MAX = 1_400_000;   // ~1 Mo d'image → data-URL confortable sous le plafond Vercel

module.exports = async (req, res) => {
  if (req.method !== 'PUT') return json(res, { erreur: 'Méthode non autorisée' }, 405);
  if (!sessionValide(req.headers.cookie)) return json(res, { erreur: 'Non authentifié' }, 401);
  let c = {};
  try { c = (req.body && typeof req.body === 'object') ? req.body : JSON.parse(req.body || '{}'); } catch (e) { return json(res, { erreur: 'Corps invalide' }, 400); }
  const key = String(c.key || '');
  if (CLES_DEPTS.indexOf(key) < 0) return json(res, { erreur: 'Département inconnu' }, 400);

  const champ = {};
  if (c.resp !== undefined) {
    const resp = String(c.resp || '').trim().slice(0, 60);
    if (!resp) return json(res, { erreur: 'Nom du responsable obligatoire' }, 400);
    champ.resp = resp;
  }
  if (c.photo !== undefined) {
    const p = String(c.photo || '');
    const dataUrl = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p);
    const chemin = /^photos\/[a-z0-9._-]+$/i.test(p);   // repli : chemin relatif déjà déployé
    if (p && !dataUrl && !chemin) return json(res, { erreur: 'Photo invalide (JPEG/PNG/WebP attendu)' }, 400);
    if (p.length > PHOTO_MAX) return json(res, { erreur: 'Photo trop lourde — réduis la taille à l\'import' }, 413);
    champ.photo = p;
  }
  if (!champ.resp && !champ.photo) return json(res, { erreur: 'Rien à enregistrer' }, 400);

  try {
    await lireDepartements();            // garantit une base existante
    await ecrireDepartement(key, champ);
    json(res, { ok: true });
  } catch (e) {
    json(res, { erreur: 'Stockage indisponible.' }, 503);
  }
};
