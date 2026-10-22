# Galerie des départements 📸🎬

Chaque département (RE, RH, Média, Formation) a sa propre galerie, visible **dans son
panneau** sur le site (clic sur la carte du département → en bas du panneau).

## Ajouter des photos ou des vidéos

1. **Déposez les fichiers** dans le dossier du département concerné :

   | Dossier | Département |
   |---|---|
   | `gallery/re/` | Relation externe |
   | `gallery/rh/` | Ressources humaines |
   | `gallery/media/` | Média |
   | `gallery/formation/` | Formation |

   Conseils :
   - Photos : JPG ou PNG, **max ~2 Mo** (redimensionnez en 1600 px de large si besoin).
   - Vidéos : MP4 (H.264), **max ~5 Mo**, format paysage 16:9 ou portrait 9:16.
   - Noms de fichiers simples, sans accents ni espaces : `soiree-partenaires.jpg`,
     `aftermovie.mp4`.

2. **Listez chaque fichier** dans `script.js`, dans le tableau `gallery` du
   département correspondant :

   ```js
   media: {
     title: 'Média',
     …
     gallery: [
       { src: 'gallery/media/soiree-partenaires.jpg', caption: 'Soirée partenaires' },
       { type: 'video', src: 'gallery/media/aftermovie.mp4', caption: 'Aftermovie 2026' }
     ]
   },
   ```

   - `type: 'video'` uniquement pour les vidéos (sinon c'est une photo par défaut).
   - `caption` (légende) facultative.

3. Ouvrez le site : la vignette apparaît automatiquement dans la galerie du
   département, avec visionneuse plein écran (clic → flèches ← → pour naviguer,
   Échap pour fermer).

> Astuce : vous pouvez aussi me renvoyer directement les fichiers (photos/vidéos) —
> je les place dans le bon dossier et je m'occupe de la mise en page.
