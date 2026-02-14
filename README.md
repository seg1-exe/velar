# VELAR

Site vitrine du studio créatif Velar : galerie full-screen en slides vidéo avec navigation au scroll, animation d’intro type roulette et page About en overlay.

## Stack technique

- **HTML / CSS / JavaScript** (vanilla)
- **Vite** — dev server et build
- **GSAP 3** + **Observer** — animations et gestion du scroll
- **Font Awesome** — icônes (via CDN)

## Prérequis

- Node.js 18+ (ou équivalent)

## Installation et lancement

```bash
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173) dans le navigateur.

### Autres commandes

| Commande        | Description                |
|----------------|----------------------------|
| `npm run dev`  | Lance le serveur de dev    |
| `npm run build`| Build de production        |
| `npm run preview` | Prévisualise le build   |

## Structure du projet

```
velar/
├── index.html              # Point d’entrée HTML
├── public/
│   ├── main.js              # Logique : intro, slides, scroll, about
│   ├── style.css            # Styles globaux et responsive
│   ├── reset.css            # Reset CSS
│   ├── logoWhite.png        # Logo (footer / accueil)
│   ├── logoBlack.png        # Logo (page About)
│   ├── assetAbout.jpg       # Image de la page About
│   └── medias/              # Vidéos et posters des slides
├── package.json
└── README.md
```

## Fonctionnalités

### Accueil (slider)

- **Intro** : animation type “roulette” avec flou de mouvement, puis zoom arrière pour révéler la première slide.
- **Navigation** : scroll (molette ou touch) pour changer de projet (slide précédente / suivante, boucle).
- **Vidéos** : une vidéo par slide, en boucle, avec poster. Clic sur la slide active pour lancer la lecture (play/pause).
- **Logo fixe** : en bas, centré ; clic pour ouvrir la page About.

### Page About

- Ouverture : clic sur le logo en bas → overlay qui monte depuis le bas.
- Contenu : texte de présentation, liste de services, image, liens contact (email, Instagram).
- Fermeture : bouton **Back** en haut à gauche → overlay redescend, retour au slider.

### Comportement général

- Pendant l’intro et les transitions, le scroll est désactivé.
- Les clics sur le logo et le bouton Back sont exclus du gestionnaire de scroll (Observer) pour éviter les conflits.

## Personnalisation

### Ajouter une slide

Dans `index.html`, dupliquer un bloc `<section class="slide">` et adapter :

- `.slide-content` : titre du projet (`.title`).
- `.media-container` : une balise `<video>` avec `poster`, `muted`, `loop`, `playsinline` et une source MP4 dans `public/medias/`.

### Modifier les médias

- **Vidéos** : ajouter les fichiers dans `public/medias/` et mettre à jour les `src` et `poster` dans `index.html`.
- **Logos** : remplacer `public/logoWhite.png` et `public/logoBlack.png`.
- **Image About** : remplacer `public/assetAbout.jpg` (référencée dans la section `.about-visual`).

### Modifier le texte About

Éditer dans `index.html` les blocs :

- `.about-description` (paragraphe de présentation)
- `.service-list` (liste des services)
- `.about-footer` (email, lien Instagram)

## Build de production

```bash
npm run build
```

Les fichiers sont générés dans `dist/`. Pour tester le build en local :

```bash
npm run preview
```

## Navigateurs

Testé avec les navigateurs récents (Chrome, Firefox, Safari, Edge). Les vidéos utilisent `playsinline` pour une lecture correcte sur mobile (notamment iOS).
