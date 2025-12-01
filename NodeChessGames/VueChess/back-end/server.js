const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(bodyParser.json());

// --- UTILITAIRES ---

// Lire la BDD
const readUsers = () => {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE));
};

// Écrire dans la BDD
const writeUsers = (users) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
};

// Validation Mot de passe (Critères demandés)
const isPasswordValid = (pwd) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd); // 8 carac, 1 maj, 1 chiffre, 1 spécial
};

// Liste de mots de passe interdits
const FORBIDDEN_PASSWORDS = ['123456', 'password', 'azerty', 'chess123'];

// --- ROUTES API ---

// 1. Inscription (POST)
app.post('/api/register', (req, res) => {
    const { email, password, confirmPassword, pseudo, nom, prenom } = req.body;
    const users = readUsers();

    if (users.find(u => u.email === email)) return res.status(400).json({ error: "Email déjà utilisé" });
    if (password !== confirmPassword) return res.status(400).json({ error: "Les mots de passe ne correspondent pas" });
    if (FORBIDDEN_PASSWORDS.includes(password)) return res.status(400).json({ error: "Mot de passe trop commun/interdit" });
    if (!isPasswordValid(password)) return res.status(400).json({ error: "Le mot de passe doit contenir 8 caractères, 1 majuscule, 1 chiffre et 1 caractère spécial." });

    const newUser = {
        id: Date.now().toString(),
        email,
        password, // En vrai projet : IL FAUT HASHER LE MOT DE PASSE (bcrypt)
        pseudo,
        nom,
        prenom,
        previousPasswords: [] // Pour l'historique
    };

    users.push(newUser);
    writeUsers(users);
    res.json({ message: "Inscription réussie", user: newUser });
});

// 2. Connexion (POST)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        res.json({ message: "Connexion réussie", user });
    } else {
        res.status(401).json({ error: "Identifiants invalides" });
    }
});

// 3. Mot de passe oublié (POST)
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (user) {
        // Simulation d'envoi de mail
        const resetToken = "secure-token-" + Date.now(); 
        // En prod, on stockerait ce token avec une expiration
        console.log(`[SIMULATION EMAIL] Lien envoyé à ${email} : http://localhost:5173/reset-password?token=${resetToken}&email=${email}`);
        res.json({ message: "Si l'email existe, un lien a été envoyé." });
    } else {
        // On ne dit pas si l'user n'existe pas pour éviter le "User Enumeration"
        res.json({ message: "Si l'email existe, un lien a été envoyé." });
    }
});

// 4. Réinitialisation Mot de passe (PUT)
app.put('/api/reset-password', (req, res) => {
    const { email, newPassword, confirmNewPassword } = req.body;
    // On vérifierait le token ici en temps normal

    if (newPassword !== confirmNewPassword) return res.status(400).json({ error: "Les mots de passe ne correspondent pas" });
    if (!isPasswordValid(newPassword)) return res.status(400).json({ error: "Mot de passe non conforme" });

    const users = readUsers();
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex !== -1) {
        // Vérification historique (ex: 3 derniers)
        if (users[userIndex].previousPasswords.includes(newPassword)) {
            return res.status(400).json({ error: "Vous ne pouvez pas réutiliser un ancien mot de passe récent." });
        }

        users[userIndex].password = newPassword;
        writeUsers(users);
        res.json({ message: "Mot de passe réinitialisé avec succès." });
    } else {
        res.status(400).json({ error: "Erreur technique." });
    }
});

// 5. GET User by ID
app.get('/api/users/:id', (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === req.params.id);
    if(user) res.json(user);
    else res.status(404).json({error: "Utilisateur introuvable"});
});

// 6. GET ALL Users (Admin)
app.get('/api/users', (req, res) => {
    const users = readUsers();
    // On retire les mots de passe avant d'envoyer
    const safeUsers = users.map(({password, previousPasswords, ...rest}) => rest);
    res.json(safeUsers);
});

// 7. Update Profile / Change Password (PUT)
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword, confirmNewPassword, email, nom, prenom, pseudo } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) return res.status(404).json({ error: "User not found" });

    let user = users[userIndex];

    // Si changement de mot de passe demandé
    if (newPassword) {
        if (user.password !== oldPassword) return res.status(403).json({ error: "Ancien mot de passe incorrect" });
        if (newPassword !== confirmNewPassword) return res.status(400).json({ error: "Confirmation incorrecte" });
        if (!isPasswordValid(newPassword)) return res.status(400).json({ error: "Nouveau mot de passe non conforme" });
        
        // Historique
        user.previousPasswords.push(user.password);
        if(user.previousPasswords.length > 3) user.previousPasswords.shift(); // Garde les 3 derniers
        
        user.password = newPassword;
    }

    // Mise à jour des infos
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (pseudo) user.pseudo = pseudo;
    // Modification email sensible -> demande pwd (simplifié ici, on assume que c'est fait si on est connecté)
    if (email) user.email = email;

    users[userIndex] = user;
    writeUsers(users);

    res.json({ message: "Profil mis à jour", user });
});

app.listen(PORT, () => {
    console.log(`Server running on mongodb+srv://ChessGame:012345@cluster0.88rwxco.mongodb.net/:${PORT}`);
});