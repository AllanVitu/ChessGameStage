# Conception et mise en place de la BDD MongoDB pour VueChess

Ce guide décrit une base MongoDB prête pour l'application Vue/Node du dépôt. Il inclut :
- le modèle de données (collections, clés et index),
- des exemples de documents (dans `BDD/*.json`),
- les commandes pour créer/peupler la base,
- un exemple de connexion côté backend Node/Express.

## 1. Modèle de données (collections MongoDB)
Chaque collection est pensée pour répondre aux écrans front existants : liste des parties, plateau, gestion du compte.

| Collection | Rôle | Champs principaux |
|------------|------|-------------------|
| `users` | Comptes joueurs et infos de connexion | `email` (unique), `passwordHash` (BCrypt), `firstname`, `lastname`, `pseudo`, `elo`, `createdAt`, `updatedAt` |
| `matches` | Métadonnées d'une partie | `name`, `status` (`pending` \| `in_progress` \| `finished`), `turn` (`white`/`black`), `createdBy`, `players` (array {`userId`, `pseudo`, `color`, `joinedAt`}), `board` (FEN + `moveNumber`), `moveCount`, `winner` |
| `players` | État individuel dans une partie (chrono, captures) | `userId`, `gameId`, `color`, `capturedPieces` (codes PGN), `clock` (restant en secondes), `lastMoveAt` |
| `squares` | Positions de pièces en cours (optionnel si tu stockes seulement le FEN) | `gameId`, `position` (ex: `e4`), `color` (`light`/`dark`), `piece` ({`type`, `color`}) |
| `moves` (à ajouter si tu veux historiser) | Historique des coups | `gameId`, `playerId`, `from`, `to`, `notation`, `captured`, `createdAt` |

> Les échantillons fournis sont dans `BDD/user.json`, `BDD/game.json`, `BDD/player.json`, `BDD/squares.json`. Ajoute un `moves.json` similaire si tu historises les coups.

## 2. Préparer MongoDB
### Option A — Docker local (recommandé)
```bash
docker run -d --name vuechess-mongo -p 27017:27017 -v vuechess-data:/data/db mongo:7
```

### Option B — MongoDB Atlas
1. Crée un cluster free tier.
2. Ajoute ton IP dans "Network Access".
3. Crée un utilisateur et récupère l'URI `mongodb+srv://...`.

## 3. Créer la base et les index
Connecte-toi avec `mongosh` (ou Atlas shell) puis exécute :
```javascript
use vuechess;

// Indexs clés
// Unicité des emails
sh.enableSharding && db.users.createIndex({ email: 1 }, { unique: true });
// Recherche par créateur/statut
sh.enableSharding && db.matches.createIndex({ createdBy: 1, status: 1 });
// Récupérer les coups par partie
sh.enableSharding && db.moves.createIndex({ gameId: 1, createdAt: 1 });
```
Si tu n'es pas en cluster shardé, remplace simplement par `db.users.createIndex(...)` (sans `sh.enableSharding`).

## 4. Importer les échantillons fournis
Depuis la racine du dépôt :
```bash
mongoimport --uri "mongodb://localhost:27017/vuechess" --collection users --jsonArray --file BDD/user.json
mongoimport --uri "mongodb://localhost:27017/vuechess" --collection matches --jsonArray --file BDD/game.json
mongoimport --uri "mongodb://localhost:27017/vuechess" --collection players --jsonArray --file BDD/player.json
mongoimport --uri "mongodb://localhost:27017/vuechess" --collection squares --jsonArray --file BDD/squares.json
```
Si tu ajoutes une collection `moves`, importe-la de la même façon.

## 5. Exemple de connexion backend (Node/Express + driver officiel)
Dans `back-end/server.js` (ou équivalent) :
```javascript
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
await client.connect();
const db = client.db("vuechess");

app.get("/api/matches", async (_req, res) => {
  const matches = await db
    .collection("matches")
    .find({}, { projection: { board: 1, players: 1, status: 1, name: 1 } })
    .toArray();
  res.json(matches);
});

app.post("/api/matches/:id/move", async (req, res) => {
  const gameId = new ObjectId(req.params.id);
  const { from, to, notation, playerId } = req.body;
  const moves = db.collection("moves");
  await moves.insertOne({ gameId, from, to, notation, playerId: new ObjectId(playerId), createdAt: new Date() });
  await db.collection("matches").updateOne({ _id: gameId }, { $inc: { moveCount: 1 }, $set: { updatedAt: new Date() } });
  res.status(201).json({ ok: true });
});

app.listen(process.env.PORT || 3000, () => console.log("API prête"));
```
`.env` attendu :
```
MONGO_URI=mongodb://localhost:27017/vuechess
PORT=3000
```

## 6. Bonnes pratiques de stockage pour les échecs
- **Plateau** : stocker le FEN dans `matches.board.fen` et, si besoin, des cases enrichies dans `squares` pour l'affichage immédiat.
- **Historique** : la collection `moves` facilite la relecture PGN sans alourdir le document `matches`.
- **Intégrité** : pour garder les couleurs cohérentes, valide côté API que chaque `match` n'a que deux joueurs (`white`/`black`) et que les `moves` respectent `turn`.
- **Nettoyage** : purge périodique des parties `finished` ou orphelines (sans coup) pour éviter d'encombrer la base de test.

Ta base Mongo est maintenant définie et prête à être branchée sur le front Vue et le backend Node/Express du projet.
