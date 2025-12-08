require('dotenv').config(); // Pour gérer les secrets
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // Pour la sécurité
const jwt = require('jsonwebtoken'); // Pour le token

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "mon_secret_super_securise"; // À mettre dans un fichier .env
const DB_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json()); // Remplace body-parser

// --- UTILITAIRES ---

const readUsers = () => {
    if (!fs.existsSync(DB_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(DB_FILE));
    } catch (e) {
        return [];
    }
};

const writeUsers = (users) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

// --- ROUTES ---

// 1. Inscription
app.post('/api/register', async (req, res) => {
    const { email, password, pseudo, nom, prenom } = req.body;
    const users = readUsers();

    if (users.find(u => u.email === email)) return res.status(400).json({ error: "Email déjà utilisé" });

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: Date.now().toString(),
        email,
        password: hashedPassword, // On stocke le hash, pas le texte clair
        pseudo,
        nom,
        prenom,
        previousPasswords: []
    };

    users.push(newUser);
    writeUsers(users);
    
    // On ne renvoie pas le mot de passe, même hashé
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ message: "Inscription réussie", user: userWithoutPassword });
});

// 2. Connexion
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);

    // Vérification sécurisée
    if (user && await bcrypt.compare(password, user.password)) {
        // Génération du Token
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
        
        // On renvoie le token au front
        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: "Connexion réussie", token, user: userWithoutPassword });
    } else {
        res.status(401).json({ error: "Identifiants invalides" });
    }
});

// ... Le reste des routes (adapter pour ne pas renvoyer les passwords) ...

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});