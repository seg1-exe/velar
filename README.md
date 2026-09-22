# VELAR

Site vitrine du studio créatif Velar : galerie plein écran en slides vidéo avec navigation au scroll, animation d'intro type roulette, page projet horizontale sur desktop, galerie INDEX/CASE et page About en overlay.

## Stack technique

- **HTML / CSS / JavaScript** (vanilla, sans framework)
- **Vite** — serveur de dev et build
- **GSAP 3** + plugin **Observer** — animations et gestion du scroll, chargés depuis le CDN cdnjs avec contrôle d'intégrité (SRI)

Aucune autre dépendance : pas de webfont (Helvetica Neue système, avec repli sans-serif), pas de librairie d'icônes.

## Prérequis

- Node.js 18+

## Installation et lancement

```bash
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173) dans le navigateur.

| Commande          | Description                     |
|-------------------|---------------------------------|
| `npm run dev`     | Lance le serveur de dev         |
| `npm run build`   | Build de production dans `dist/` |
| `npm run preview` | Prévisualise le build           |

## Structure du projet

```
velar/
├── index.html                # Point d'entrée : SEO (meta, Open Graph, JSON-LD), squelette, texte About
├── public/                   # Servi tel quel (copié intégralement dans dist/ au build)
│   ├── data.json             # ← CONTENU : projets + images CASE (seul fichier à éditer au quotidien)
│   ├── main.js               # Logique : intro, slides, scroll, page projet, galerie, about
│   ├── ascii-video.js        # Rendu ASCII de la vidéo du About (desktop uniquement)
│   ├── style.css             # Styles : base, bloc desktop (≥ 768px), bloc mobile (< 768px)
│   ├── reset.css             # Reset CSS
│   ├── legal.css             # Styles des pages légales
│   ├── legal-notice.html     # Mentions légales
│   ├── privacy-policy.html   # Politique de confidentialité
│   ├── robots.txt / sitemap.xml
│   ├── logoWhite.png         # Logo blanc (accueil / nav)
│   ├── logoBlack.png         # Logo noir (page projet / galerie / about)
│   └── medias/               # Vidéos, covers, vignettes et photos des projets
│       └── case/             # Images de l'onglet CASE
├── .claude/launch.json       # Config de preview du serveur de dev
├── package.json
└── README.md
```

> `main.js`, `style.css` et `ascii-video.js` sont dans `public/`, donc Vite les copie sans les transformer (pas de minification ni d'empreinte de cache).

## Fonctionnement

- **Intro** : roulette sur toutes les covers pendant 1,5 s, puis le scroll est libéré.
- **Accueil** : une slide plein écran par projet. Le scroll vertical (molette ou toucher) est lissé et s'aimante sur la slide la plus proche. Après un court arrêt sur une slide, sa vidéo démarre en muet par-dessus la cover.
- **Desktop (≥ 768px)** : un clic sur une slide ouvre la **page projet**, une piste horizontale avec un panneau par projet et un bandeau d'infos (titre, description, crédits, date) en bas. INFO ouvre le About.
- **Mobile (< 768px)** : un tap sur la slide bascule la vidéo en vue entière (non recadrée), un second tap remet la cover. Un swipe vers la gauche ouvre l'onglet CASE. Il n'y a pas de page projet sur mobile. Le logo en bas ouvre le About.
- **INDEX / CASE** : overlay avec les vignettes des projets (INDEX) et les images libres (CASE). Le bouton de la nav desktop est actuellement masqué dans `index.html` (`#nav-index-case`).
- Passer d'un côté à l'autre du seuil de 768px recharge la page.

## Gestion du contenu

Tout le contenu éditorial est dans `public/data.json` :

```json
{
  "projects": [ ... ],
  "case": [ ... ]
}
```

L'ordre du tableau `projects` est l'ordre d'affichage (accueil et page projet).

### Champs d'un projet

| Champ         | Obligatoire | Rôle |
|---------------|-------------|------|
| `title`       | oui | Titre affiché sur la slide, dans la nav et dans INDEX |
| `description` | oui | Texte du bandeau d'infos de la page projet |
| `credits`     | non | Crédits du bandeau d'infos (`""` si aucun : la description prend la place) |
| `date`        | oui | Année ou mention libre (`"2026"`, `"2026 Edition"`) |
| `video`       | oui* | Vidéo de la slide d'accueil (teaser court) et, par défaut, de la page projet |
| `thumb`       | oui | Vignette INDEX et poster par défaut de la slide |
| `cover`       | non | Poster de la slide d'accueil et de la page projet, s'il doit différer de `thumb` |
| `photo`       | non | Photo affichée à côté de la vidéo sur la page projet |
| `fullVideo`   | non | Version longue lue sur la page projet à la place de `video` |
| `portrait`    | non | `true` si la vidéo de la page projet est verticale : cellule vidéo au ratio 2:3 (léger zoom), la photo prend le reste |
| `videos` + `posters` | non | Panneau à plusieurs vidéos qui tournent une à une (ex. Ba&sh), avec un poster par vidéo |
| `images`      | non | Panneau à plusieurs images en colonnes, sans vidéo (ex. festival) |
| `image` + `imageMobile` | non | Slide d'accueil en image fixe au lieu d'une vidéo (\* remplace `video`) |

Trois types de panneau sur la page projet, choisis automatiquement :

1. **Standard** : une vidéo (60 %) + une photo (40 %). Avec `portrait`, la vidéo garde son cadre vertical et la photo s'élargit.
2. **Multi-vidéos** : `videos` + `posters`, trois cellules égales, une seule vidéo joue à la fois.
3. **Multi-images** : `images`, une colonne par image.

### Ajouter un projet

1. Déposer les fichiers dans `public/medias/` (voir les conventions plus bas) :
   - le teaser : `monprojet.mp4`
   - la vignette : `MONPROJET.webp`
   - la photo de la page projet : `MONPROJET_PHOTO.webp`
   - éventuellement la version longue : `monprojet_full.mp4`

2. Ajouter un objet dans `projects` :

```json
{
  "title": "MON PROJET",
  "description": "Description courte du projet.",
  "credits": "DIRECTED BY ... PRODUCED BY Velar",
  "date": "2026",
  "video": "medias/monprojet.mp4",
  "fullVideo": "medias/monprojet_full.mp4",
  "thumb": "medias/MONPROJET.webp",
  "photo": "medias/MONPROJET_PHOTO.webp"
}
```

### Modifier ou supprimer un projet

Modifier les champs directement dans `data.json`. Pour supprimer, retirer l'objet entier du tableau (et la virgule qui précède si c'était le dernier), puis supprimer ses médias de `public/medias/` s'ils ne servent à aucun autre projet.

### Images INDEX / CASE

Le tableau `case` liste les images de l'onglet CASE :

```json
"case": [
  "medias/case/image1.jpg",
  "medias/case/image2.jpg"
]
```

Ajouter : déposer l'image dans `public/medias/case/` et ajouter son chemin. Supprimer : retirer la ligne. Les vignettes INDEX viennent du champ `thumb` des projets.

### Option en veille : description et crédits au tap sur mobile

`main.js` contient une option désactivée (`MOBILE_TAP_INFO = false`) : un tap sur la slide affiche la description et les crédits en lignes surlignées de blanc, le fond de chaque ligne arrivant du côté puis les lettres montant une à une de gauche à droite. Passer la constante à `true` pour l'activer ; le tap remplace alors la vue entière de la vidéo.

## Médias : conventions

Tout ce qui est dans `public/` part dans le build, donc **ne jamais laisser de sources brutes (MOV, ProRes, PNG lourds) dans `public/medias/`**. Les sources sont rangées hors du dépôt, dans `../velar-sources/`.

**Vidéos** : MP4 H.264 (profil High), sans piste audio, index en tête de fichier (`faststart`), 1080p maximum, 24 à 30 images/s, 2 à 3 Mbit/s selon le contenu. Un teaser d'accueil de 8 à 10 s pèse 2 à 3 Mo.

```bash
ffmpeg -i source.mov -an -c:v libx264 -preset slow -crf 25 -profile:v high -pix_fmt yuv420p -movflags +faststart medias/monprojet.mp4
```

**Images** : WebP, 1920 px de large maximum, qualité 80 à 85. Une cover ou une vignette se génère depuis la vidéo elle-même, idéalement sur ses premières images pour que le poster enchaîne sans saut sur la lecture :

```bash
ffmpeg -ss 1 -i medias/monprojet.mp4 -frames:v 1 -c:v libwebp -quality 82 medias/MONPROJET.webp
```

**Convertir un PNG** :

```bash
ffmpeg -i source.png -vf "scale=1920:-2" -c:v libwebp -quality 85 medias/MONPROJET_PHOTO.webp
```

## Médias statiques et textes

- **Logos** : `public/logoWhite.png` et `public/logoBlack.png`.
- **Visuel About** : `public/medias/flowersWhite.webm`, rendu en ASCII par `ascii-video.js`, sur desktop uniquement (masqué et non chargé sur mobile).
- **Texte About** : directement dans `index.html`, blocs `.about-description` (présentation), `.service-list` (services), `.about-address` (adresse) et `.about-footer` (Instagram). L'email est assemblé par `main.js` pour éviter le spam.
- **Pages légales** : `public/legal-notice.html` et `public/privacy-policy.html`, en `noindex`.
- **SEO** : title, meta description, Open Graph, Twitter Card et JSON-LD dans `index.html` ; `public/sitemap.xml` et `public/robots.txt`. L'image de partage est `public/medias/velar-og.jpg`.

## Build de production

```bash
npm run build
```

Les fichiers sont générés dans `dist/`, médias compris. Pour tester le build en local :

```bash
npm run preview
```

## Navigateurs

Testé avec les navigateurs récents (Chrome, Firefox, Safari, Edge). Les vidéos utilisent `muted` et `playsinline` pour une lecture correcte sur mobile, notamment iOS.
