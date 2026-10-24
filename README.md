# INNOVATION 🚀

Site du **club scientifique Innovation** de l'**ESGN Kolea**.

## Fichiers du site

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique : accueil (bannière héros animée en particules), présentation, nos membres, événements & activités, nos réseaux |
| `styles.css` | Apparence du site (palette bleu marine du club) |
| `script.js` | Menu mobile, lien actif au défilement, animations douces |
| `api/`, `lib/` | Backend du panneau `/admin` : fonctions serveur Vercel (sessions, stockage KV) |
| `favicon.svg` | Logo du club (onglet du navigateur) |

## Personnaliser le site

La page principale se trouve dans **`index.html`** :

- **Les membres** : chercher « À compléter » (cartes du bureau) et remplacer par les vrais noms.
- **Les photos de l'équipe** : déposez les fichiers dans `photos/` avec les noms utilisés dans la page (`president.jpg`, `vice-presidente-1.jpg`, `vice-presidente-2.jpg`, `re.jpg`, `rh.jpg`, `formation.jpg`, `media.jpg`).
- **Les événements** : utilisez le panneau `/admin` pour ajouter, modifier ou supprimer les événements.
- **Votre vrai logo** dans l'animation du héros : déposez un fichier `logo.png` (fond clair) à la racine, puis dans la section `CONFIG` passez `LOGO_SRC: "logo.png"` (au lieu de `null`). Sinon, le logo vectoriel du club est utilisé.
- **Les réseaux sociaux** : déjà configurés (Instagram, TikTok, LinkedIn, Facebook, e-mail).
- **La galerie** (photos & vidéos) : voir `gallery/README.md` — les fichiers vont dans `gallery/media/` et les légendes sont définies dans `SITE_MEDIA`, dans `script.js`.

## Administration des événements

Le panneau est disponible à l'adresse `/admin`. Il permet de gérer les trois événements de départ comme les
nouveaux événements, qui utilisent automatiquement le même affichage et les mêmes animations.

Le panneau repose sur les fonctions serveur Vercel du dossier `api/`. Dans le projet Vercel, configurez
les variables `ADMIN_EMAIL` et `ADMIN_PASSWORD` (plus `SESSION_SECRET`, une valeur aléatoire d'au moins
32 caractères, recommandée) et connectez un stockage **Vercel KV** au projet : les variables
`KV_REST_API_URL` / `KV_REST_API_TOKEN` sont alors ajoutées automatiquement. Ne placez pas ces identifiants
dans les fichiers du site ni dans Git. Au premier appel, le stockage est initialisé avec les trois événements
d'exemple.

## Aperçu local

Ouvrez `index.html` dans un navigateur, ou lancez un petit serveur pour consulter le site :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```
