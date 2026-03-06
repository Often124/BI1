# Bi1Gestion — Affichage Dynamique

Application web complète pour écran d'affichage dynamique avec dashboard administrateur.

## Fonctionnalités

### Écran d'affichage (`/`)
- Diaporama d'images en plein écran avec transitions fluides
- Durée d'affichage personnalisable par image
- Bandeau d'informations en bas de l'écran :
  - 🕐 Horloge en temps réel
  - 📅 Date du jour
  - 🌤️ Météo (OpenWeatherMap)
  - 📝 Texte défilant personnalisable
- Actualisation automatique du contenu (toutes les 30 secondes)
- Curseur masqué pour un affichage propre

### Dashboard administrateur (`/admin`)
- 🔐 Connexion sécurisée (JWT)
- 🖼️ Gestion des images (ajout, suppression, réordonnement par drag & drop)
- ⏱️ Durée d'affichage par image
- 👁️ Activation/désactivation individuelle des images
- ⚙️ Configuration du bandeau (texte, météo, widgets)
- 📺 Prévisualisation en temps réel

## Installation

```bash
# Installer les dépendances
npm install

# Initialiser la base de données
npm run seed

# Lancer en développement
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

## Configuration

### Variables d'environnement (`.env.local`)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `JWT_SECRET` | Clé secrète pour les tokens JWT | `bi1gestion-secret-key-change-me-in-production` |
| `ADMIN_USERNAME` | Nom d'utilisateur admin | `admin` |
| `ADMIN_PASSWORD` | Mot de passe admin | `admin123` |
| `OPENWEATHER_API_KEY` | Clé API OpenWeatherMap | _(vide)_ |
| `NEXT_PUBLIC_BASE_URL` | URL de l'application | `http://localhost:3000` |

### Météo
Pour activer la météo, obtenez une clé API gratuite sur [OpenWeatherMap](https://openweathermap.org/api) et configurez-la dans le dashboard admin ou dans `.env.local`.

## URLs

| Page | URL |
|------|-----|
| Écran d'affichage | http://localhost:3000 |
| Dashboard admin | http://localhost:3000/admin |

## Identifiants par défaut

- **Utilisateur :** admin
- **Mot de passe :** admin123

> ⚠️ Changez les identifiants dans `.env.local` avant le déploiement en production.

## Stack technique

- **Frontend :** Next.js 14 (App Router) + React 18
- **UI :** Tailwind CSS
- **Backend :** API Routes Next.js (REST)
- **Base de données :** JSON (fichier local)
- **Authentification :** JWT
- **Stockage images :** Système de fichiers local (`public/uploads/`)

## Déploiement

### Build de production
```bash
npm run build
npm start
```

### Docker (optionnel)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Structure du projet

```
├── src/
│   ├── app/
│   │   ├── page.tsx              # Écran d'affichage
│   │   ├── admin/page.tsx        # Dashboard admin
│   │   ├── layout.tsx            # Layout principal
│   │   ├── globals.css           # Styles globaux
│   │   └── api/
│   │       ├── auth/route.ts     # Authentification
│   │       ├── slides/route.ts   # CRUD slides
│   │       ├── settings/route.ts # Paramètres
│   │       ├── upload/route.ts   # Upload images
│   │       └── weather/route.ts  # Proxy météo
│   ├── components/
│   │   ├── Slideshow.tsx         # Diaporama
│   │   ├── InfoBanner.tsx        # Bandeau infos
│   │   ├── Clock.tsx             # Horloge
│   │   ├── DateDisplay.tsx       # Date
│   │   ├── Weather.tsx           # Météo
│   │   ├── ScrollingText.tsx     # Texte défilant
│   │   └── admin/
│   │       ├── LoginForm.tsx     # Formulaire connexion
│   │       ├── SlideManager.tsx  # Gestion images
│   │       ├── BannerSettings.tsx# Paramètres bandeau
│   │       └── DisplayPreview.tsx# Prévisualisation
│   ├── lib/
│   │   ├── db.ts                 # Couche données
│   │   └── auth.ts               # Authentification
│   └── types/
│       └── index.ts              # Types TypeScript
├── public/uploads/               # Images uploadées
├── data/db.json                  # Base de données
└── scripts/seed.js               # Initialisation
```
