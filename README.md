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
│   ├── data.json            # ← CONTENU : projets + images case (seul fichier à éditer)
│   ├── main.js              # Logique : intro, slides, scroll, about
│   ├── style.css            # Styles globaux et responsive
│   ├── reset.css            # Reset CSS
│   ├── logoWhite.png        # Logo blanc (accueil / nav)
│   ├── logoBlack.png        # Logo noir (page projet / about)
│   ├── assetAbout.png       # Image de la page About
│   └── medias/              # Vidéos, posters et images des projets
│       └── case/            # Images de l'onglet CASE
├── package.json
└── README.md
```

## Gestion du contenu

Tout le contenu (projets et images case) est centralisé dans un seul fichier :

```
public/data.json
```

Il n'y a **aucune modification à faire** dans `index.html` ou `main.js`.

---

### Structure de `data.json`

```json
{
  "projects": [ ... ],
  "case": [ ... ]
}
```

---

### Ajouter un projet

1. Déposer les fichiers dans `public/medias/` :
   - la vidéo : `monprojet.mp4`
   - le poster (image de fallback) : `MONPROJET.png`
   - les photos de la page projet : `MONPROJET_1.png`, `MONPROJET_2.png`, etc.

2. Ajouter un objet dans le tableau `"projects"` de `data.json` :

```json
{
  "title": "NOM DU PROJET",
  "description": "Description courte du projet.",
  "tags": ["CGI", "Art Direction", "Post Production"],
  "date": "2024",
  "video": "medias/monprojet.mp4",
  "thumb": "medias/MONPROJET.png",
  "photos": [
    "medias/MONPROJET_1.png",
    "medias/MONPROJET_2.png"
  ]
}
```

> L'ordre dans le tableau détermine l'ordre d'affichage dans le slider.

**Champs disponibles pour les `tags` :**
`"Narrative Production"`, `"CGI"`, `"AI"`, `"Art Direction"`, `"Social-First Content"`, `"Motion Design"`, `"Post Production"`

---

### Modifier un projet

Ouvrir `data.json`, trouver l'objet correspondant au projet et modifier les champs souhaités. Exemple — changer l'année :

```json
"date": "2025"
```

---

### Supprimer un projet

Supprimer l'objet entier `{ ... }` correspondant dans le tableau `"projects"`.
Ne pas oublier de retirer la virgule de l'objet précédent si c'était le dernier élément.

---

### Ajouter / supprimer des images dans INDEX/CASE

Le tableau `"case"` liste les chemins des images affichées dans l'onglet **CASE** de la galerie.

```json
"case": [
  "medias/case/image1.jpg",
  "medias/case/image2.jpg"
]
```

- **Ajouter** : déposer l'image dans `public/medias/case/` et ajouter son chemin au tableau.
- **Supprimer** : retirer la ligne correspondante du tableau.

---

### Modifier les médias statiques

- **Logos** : remplacer `public/logoWhite.png` et `public/logoBlack.png`.
- **Image About** : remplacer `public/assetAbout.png`.

### Modifier le texte About

Éditer directement dans `index.html` les blocs :

- `.about-description` — paragraphe de présentation et adresse
- `.service-list` — liste des services
- `.about-footer` — lien Instagram (l'email est géré automatiquement dans `main.js`)

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
