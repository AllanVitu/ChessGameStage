require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'mon_secret_super_securise';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chess_game';
const DB_NAME = process.env.MONGO_DB_NAME;

// --- BASE DE DONNÉES ---
mongoose
  .connect(MONGO_URI, { dbName: DB_NAME })
  .then(() => {
    console.log('Connecté à MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Connexion à MongoDB échouée :', err.message);
    process.exit(1);
  });

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    pseudo: { type: String, required: true, trim: true },
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    previousPasswords: { type: [String], default: [] },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

app.use(cors());
app.use(express.json());

const generateToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });

// --- ROUTES ---

// 1. Inscription
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, pseudo, nom, prenom } = req.body;

    if (!email || !password || !pseudo || !nom || !prenom) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      pseudo,
      nom,
      prenom,
      previousPasswords: [],
    });

    const token = generateToken(newUser);
    res.json({ message: 'Inscription réussie', token, user: newUser.toJSON() });
  } catch (error) {
    console.error('Erreur lors de l\'inscription :', error);
    res.status(500).json({ error: 'Impossible de créer le compte pour le moment.' });
  }
});

// 2. Connexion
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user);
      res.json({ message: 'Connexion réussie', token, user: user.toJSON() });
    } else {
      res.status(401).json({ error: 'Identifiants invalides' });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ error: 'Impossible de se connecter pour le moment.' });
  }
});

// Les autres routes pourront être ajoutées ici en s'assurant de ne jamais renvoyer les mots de passe
