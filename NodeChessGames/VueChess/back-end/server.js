import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'mon_secret_super_securise';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chess_game';
const DB_NAME = process.env.MONGO_DB_NAME || 'chess_game';
const STATE_LABELS = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// --- BASE DE DONNEES ---
mongoose
  .connect(MONGO_URI, { dbName: DB_NAME })
  .then(() => {
    console.log('Connecte a MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Connexion a MongoDB echouee :', err.message);
    process.exit(1);
  });

mongoose.connection.on('error', (err) => {
  console.error('Erreur MongoDB :', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB deconnecte');
});

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    pseudo: { type: String, required: true, trim: true },
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' }, // data URL (PNG/JPEG) stocke en base
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
// Autoriser un JSON plus gros pour accepter les images encodees en base64
app.use(express.json({ limit: '4mb' }));

const generateToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });

// --- ROUTES ---

// 0. Healthcheck base de donnees
app.get('/api/health', async (_req, res) => {
  const state = STATE_LABELS[mongoose.connection.readyState] || 'unknown';
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
    }
    res.json({ status: 'ok', db: state });
  } catch (error) {
    res.status(500).json({ status: 'error', db: state, error: error.message });
  }
});

// 1. Inscription
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, pseudo, nom, prenom } = req.body;

    if (!email || !password || !pseudo || !nom || !prenom) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email deja utilise' });

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
    res.json({ message: 'Inscription reussie', token, user: newUser.toJSON() });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    res.status(500).json({ error: 'Impossible de creer le compte pour le moment.' });
  }
});

// 2. Connexion
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user);
      res.json({ message: 'Connexion reussie', token, user: user.toJSON() });
    } else {
      res.status(401).json({ error: 'Identifiants invalides' });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ error: 'Impossible de se connecter pour le moment.' });
  }
});

// 3. Mise a jour du profil (y compris avatar)
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['pseudo', 'nom', 'prenom', 'email', 'avatar'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Aucune donnee a mettre a jour.' });
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    res.json({ message: 'Profil mis a jour', user: updatedUser.toJSON() });
  } catch (error) {
    console.error('Erreur lors de la mise a jour du profil :', error);
    res.status(500).json({ error: 'Impossible de mettre a jour le profil pour le moment.' });
  }
});

// Les autres routes pourront etre ajoutees ici en s'assurant de ne jamais renvoyer les mots de passe
