# Tutoriel complet WarChess / VueChess

Ce guide reprend la maquette HTML V01 et détaille, étape par étape, comment reconstruire l'application Vue 3, brancher un backend Node/Express et une base MongoDB, puis activer une partie locale jouable à deux sur la même machine.

## 1. Lire la maquette et la transposer en composants
- **Palette et structure** : la maquette (common.css) définit un écran mobile 430px de large avec un `container` sombre, des cartes (`.card`), des grilles (`.grid2`, `.grid3`) et des boutons `.btn`/`.btn-outline`.
- **Écrans clés** :
  - `index.html` → page de connexion avec logo, formulaire et liens d'inscription/mot de passe oublié.
  - `views/matchList.html` → liste des parties avec créateur, couleur et bouton « Join ».
  - `views/game.html` → plateau 8x8 stylé avec repères alphabétiques/numériques.
- **Traduction Vue** : chaque écran devient une vue (`LoginView`, `RegisterView`, `MatchListView`, `ChessBoard`) rendue via `RouterView` dans `App.vue`. Le CSS commun est copié dans `src/assets/common.css` et complété par `src/assets/main.css` pour les ajustements globaux.

## 2. Installer et lancer le front
```bash
cd NodeChessGames/VueChess
npm install   # installe les dépendances déjà listées dans package.json
npm run dev   # démarre Vite sur http://localhost:5173
```
> Astuce : l'import `main.css` étant présent dans `src/main.ts`, assure-toi que le fichier existe (il est fourni) pour éviter les erreurs Vite.

## 3. Structurer le routing et l'état
- **Router (`src/router/index.ts`)** : routes `/`, `/register`, `/match-list`, `/game/:id`, etc., avec un `beforeEach` qui redirige vers `/` si l'utilisateur n'est pas authentifié.
- **Store utilisateur (`src/stores/user.ts`)** : conserve `token` et `user` dans Pinia + `localStorage`. Un bouton « Mode local » sur la page de login crée un token local pour tester sans backend.
- **Store des parties (`src/stores/matches.ts`)** : garde en mémoire la liste des matchs locaux, le plateau 8x8, le tour de jeu et le statut. Les fonctions clés sont `createMatch`, `joinMatch`, `updateBoard`, `resetMatch`.

## 4. Recréer les vues avec le style de la maquette
- **Login** : logo, formulaire email/mot de passe, bouton d'inscription, lien mot de passe oublié et bouton « Mode local (sans API) ».
- **Register** : grilles 3 colonnes pour pseudo/prénom/nom/email/mots de passe + validation locale des mots de passe.
- **MatchList** : carte de création de partie (pseudo hôte, pseudo adversaire, couleur de départ) puis liste des parties d'exemple (Michael, Spoutnik, etc.) avec boutons « Rejoindre/Reprendre ».
- **ChessBoard** : plateau 8x8 identique à la maquette (`#plateau`, cases clair/obscur, repères de colonnes/rangs). Les noms des joueurs (blanc/noir), un bouton de reset et un lien « Retour à la liste » encadrent le plateau.

## 5. Logique de partie locale (sans serveur)
- Le plateau est un tableau 2D de pièces (`type` + `color`). Les mouvements gèrent :
  - Pions (1 ou 2 cases au départ, capture en diagonale, promotion automatique en dame).
  - Tours, fous, dame (déplacements glissants bloqués par les pièces), cavaliers (sauts en L) et roi (un pas). Pas de roque ni d'en-passant pour rester simple.
- Le tour alterne automatiquement et l'état est stocké dans Pinia via `matchesStore.updateBoard(...)`.
- Chaque nouvelle partie part d'une position standard via `matchesStore.createMatch(...)` + `joinMatch(...)`.

## 6. Préparer le backend Node/Express
1. **Créer le projet** (si tu repars de zéro) :
   ```bash
   mkdir back-end && cd back-end
   npm init -y
   npm install express cors bcryptjs jsonwebtoken mongodb dotenv
   ```
2. **Configurer l'app** (`server.js`) : middlewares `cors()` et `express.json()`, routes `/api/register`, `/api/login`, `/api/matches` et `/api/matches/:id/move` (si tu veux persister les coups).
3. **Sécurité** :
   - Stocke `SECRET_KEY`, `MONGO_URI`, `PORT` dans `.env`.
   - Hache les mots de passe avec `bcryptjs` et génère des JWT avec `jsonwebtoken`.
4. **Lancer le serveur** : `node server.js` (ou `npm run dev` avec nodemon).

## 7. Créer la base MongoDB
1. **Installer MongoDB** (local) ou utiliser Atlas.
   - Local (Ubuntu/Debian) :
     ```bash
     sudo apt-get update
     sudo apt-get install -y mongodb
     sudo systemctl enable --now mongodb
     ```
   - Atlas : crée un cluster free tier, puis récupère l'URI de connexion `mongodb+srv://...`.
2. **Créer la base et les collections** :
   ```bash
   mongosh
   use warchess
   db.createCollection('users')
   db.createCollection('matches')
   ```
3. **Indexer pour les logins** :
   ```js
   db.users.createIndex({ email: 1 }, { unique: true })
   ```
4. **Modèle de documents** :
   - `users` : `{ _id, email, passwordHash, pseudo, nom, prenom, createdAt }`.
   - `matches` : `{ _id, host, opponent, color, status, board, turn, history, createdAt }`.
5. **Chaîne de connexion** : dans `.env`, ajoute `MONGO_URI="mongodb://127.0.0.1:27017/warchess"` (ou l'URI Atlas) et `SECRET_KEY="une_chaine_aleatoire"`.

## 8. Connecter le backend à MongoDB
```js
const { MongoClient, ObjectId } = require('mongodb')
const client = new MongoClient(process.env.MONGO_URI)
await client.connect()
const db = client.db()
const users = db.collection('users')
const matches = db.collection('matches')
```
- Dans `/api/register`, insère l'utilisateur avec `passwordHash` (bcrypt).
- Dans `/api/login`, vérifie le hash puis retourne un JWT.
- Dans `/api/matches`, renvoie les parties ouvertes (`status: 'waiting'`) et ajoute `POST /api/matches` pour créer une partie, `PATCH /api/matches/:id/move` pour enregistrer le plateau/turn après chaque coup.

## 9. Brancher le front sur l'API
- Remplace dans `LoginView`/`RegisterView` l'URL `http://localhost:3000/api/...` si ton API tourne ailleurs.
- Dans `MatchListView`, remplace les seeds par un appel à `/api/matches` puis `matchesStore` devient un cache local. Pour un mode offline, garde les seeds en fallback.
- Dans `ChessBoard`, appelle `PATCH /api/matches/:id/move` après chaque `updateBoard` pour sauvegarder la position.

## 10. Vérifications rapides avant livraison
- `npm run dev` (front) puis parcours : login → mode local → créer une partie → jouer quelques coups → reset → retour liste.
- `npm test` / `npm run build` si nécessaire pour valider la compilation.

Bon code ! Ce plan reprend la maquette et ajoute toutes les étapes pour aller jusqu'à une app jouable, avec ou sans backend MongoDB.
