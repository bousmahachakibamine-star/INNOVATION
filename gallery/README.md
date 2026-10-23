# Galerie du site 📸🎬

La galerie vit dans une **section dédiée** du site (`#galerie`), plus dans les panneaux
des départements. Elle affiche tous les médias du club dans un espace unique :

- **Une grille stylée** — toutes les photos et vidéos, avec légende et badge « vidéo ».
- **Deux rubans infinis** — les vidéos défilent en boucle (sens inversé sur la 2ᵉ rangée),
  en lecture automatique, coupées au survol.
- **Une visionneuse plein écran** — clic sur une vignette, flèches ← → pour naviguer,
  Échap pour fermer.

## Ajouter des photos ou des vidéos

1. **Déposez le fichier** dans `gallery/media/` :
   - Photos : JPG ou PNG, **max ~2 Mo** (redimensionnez en 1600 px de large si besoin).
     Les HEIC d'iPhone doivent d'abord être convertis en JPG.
   - Vidéos : MP4 **H.264** (lisible partout), **max ~5 Mo**, 16:9 ou 9:16.
   - Noms simples, sans accents ni espaces : `soiree-2026.jpg`, `aftermovie.mp4`.

2. **Ajoutez une entrée** dans `script.js`, dans le tableau `SITE_MEDIA` :

   ```js
   { src: 'gallery/media/soiree-2026.jpg', caption: 'Soirée partenaires 2026' },
   { type: 'video', src: 'gallery/media/aftermovie.mp4', caption: 'Aftermovie 2026',
     poster: 'gallery/media/poster-aftermovie.jpg' },
   ```

   - `type: 'video'` uniquement pour les vidéos (sinon c'est une photo).
   - `caption` : légende affichée sous la vignette et dans la visionneuse.
   - `poster` (facultatif) : image d'affichage de la vidéo avant lecture. Sans poster,
     la première image de la vidéo sert d'aperçu.

C'est tout : la vignette apparaît dans la grille, et les vidéos sont **automatiquement
ajoutées aux rubans infinis** (elles alternent entre les deux rangées).

> Astuce : vous pouvez aussi me renvoyer directement les fichiers (photos/vidéos) —
> je les convertis si besoin, je place le poster et je m'occupe de la mise en page.
