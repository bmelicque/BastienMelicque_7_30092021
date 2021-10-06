const db = require('../config/db');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const zxcvbn = require('zxcvbn');

const findUserByMail = async (email) => {
    const sql = `SELECT * FROM users WHERE users.email = ?`;
    const [user] = await (await db).query(sql, email);
    if (!user) throw {
        code: 404,
        message: 'Utilisateur inexistant'
    }
    else return user;
}

// On signup, the email is hashed to respect GDPR (no personal data stored on the server)
// The password is encrypted for security reasons
exports.signup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Checking if the email is valid
        if (!isEmail(email))
            throw 'Adresse email invalide';

        // Checking email unicity
        if (findUserByMail(email))
            throw 'Adresse email invalide';

        // Checking if the password is strong enough
        const { score } = zxcvbn(password, [username, email]);
        if (score <= 1)
            throw 'Mot de passe invalide (trop faible)';

        // Actual post to database
        const hash = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;
        await (await db).query(sql, [email, hash]);
        res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
        if (error.includes('email') || error.includes('mot de passe'))
            res.status(400).json({ err });
        else res.status(500).json({ err });
    }
}


// Hashes the provided email to see if it exists in the database
// Then compares the provided password with the encrypted one in the database
// On success, provides a secured token to the user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Checking if email exists in the database
        const user = findUserByMail(email)
        if (!user)
            throw 'Identifiant(s) incorrect(s)'

        // Checking if the password is valid
        const valid = await bcrypt.compare(password, user.password)
        if (!valid)
            throw 'Identifiant(s) incorrect(s)'

        // Sending token
        const maxAge = 2 * 86400000; // 2 days
        res.cookie('token', jwt.sign(
            { userId: user.id, role: user.role },
            process.env.TOKEN_PRIVATE_KEY,
            { expiresIn: maxAge }
        ), {
            httpOnly: true,
            maxAge: maxAge
        })
        res.status(200).json({ message: 'Connecté' })
    } catch (error) {
        if (error.includes('Identifiant'))
            res.status(401).json({ error })
        else res.status(500).json({ error });
    }
}

exports.logout = async (req, res) => {
    res.cookie('token', null, { maxAge: 1 });
    res.status(200).json({ message: 'Déconnecté' })
}