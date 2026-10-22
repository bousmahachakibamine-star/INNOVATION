# INNOVATION 🚀

Site du **club scientifique Innovation** de l'**ESGN Kolea**.

## Fichiers du site

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique : accueil (bannière héros animée en particules), présentation, nos membres, événements & activités, nos réseaux |
| `styles.css` | Apparence du site (palette bleu marine du club) |
| `script.js` | Menu mobile, lien actif au défilement, animations douces |
| `favicon.svg` | Logo du club (onglet du navigateur) |

## Personnaliser le site

Tout se fait dans **`index.html`** :

- **Les membres** : chercher « À compléter » (cartes du bureau) et remplacer par les vrais noms.
- **Les photos de l'équipe** : déposez les fichiers dans `photos/` avec les noms listés dans `photos/README.md` (`president.jpg`, `vice-presidente-1.jpg` = Darine, `vice-presidente-2.jpg` = Ouidad, `re.jpg`, `rh.jpg`, `formation.jpg`, `media.jpg`) — aucune ligne de code à toucher. Les deux vice-présidentes portent le même titre affiché, mais leurs cartes sont codées `vp1`/`vp2` pour changer facilement.
- **Les événements** : chercher « Dates à adapter » et modifier les dates/descriptions.
- **Votre vrai logo** dans l'animation du héros : déposez un fichier `logo.png` (fond clair) à la racine, puis dans la section `CONFIG` passez `LOGO_SRC: "logo.png"` (au lieu de `null`). Sinon, le logo vectoriel du club est utilisé.
- **Les réseaux sociaux** : déjà configurés (Instagram, TikTok, LinkedIn, Facebook, e-mail).

## Aperçu local

Ouvrez `index.html` dans un navigateur, ou lancez un petit serveur :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```
