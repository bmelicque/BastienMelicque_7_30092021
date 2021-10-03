const db = require('../config/db');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoJS = require('crypto-js');
const zxcvbn = require('zxcvbn');


const isInDB = async (field, value) => {
    const sql = `SELECT * FROM users WHERE users.${field} = ?`;
    const [isInDB] = await (await db).query(sql, value);
    return (!!isInDB)
}


// On signup, the email is hashed to respect GDPR (no personal data stored on the server)
// The password is encrypted for security reasons
exports.signup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        let err = {};
        // Checking if the email is valid
        if (!isEmail(email))
            err.email = 'Adresse email incorrecte';

        const hashedEmail = cryptoJS.SHA3(email).toString();

        // Checking email unicity
        if (isInDB('email', hashedEmail))
            err.email = 'Cet email est déjà utilisée';

        // Checking username unicity
        if (isInDB('username', username))
            err.username = 'Ce pseudo est déjà utilisé';

        // Checking if the password is strong enough
        const { score } = zxcvbn(password, [username, email]);
        if (score <= 1)
            err.password = 'Ce mot de passe est trop faible. Pensez à utiliser des nombres, des caractères spéciaux ou à le rallonger';

        if (err != {})
            throw err;

        // Actual post to database
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
        await (await db).query(sql, [username, hashedEmail, hashedPassword])
        res.status(201).json({ message: 'Utilisateur créé avec succès' })
    } catch (err) {
        if ('email' in err || 'username' in err || 'password' in err)
            res.status(400).json({ err })
        else res.status(500).json({ err })
    }
}


// Hashes the provided email to see if it exists in the database
// Then compares the provided password with the encrypted one in the database
// On success, provides a secured token to the user
exports.login = async (req, res) => {
    try {
        // Checking if email exists in the database
        if (!isInDB('email', hashedEmail))
            return res.status(401).json({ error: 'Utilisateur inexistant' })

        // Checking if the password is valid
        const valid = await bcrypt.compare(req.body.password, user.password)
        if (!valid)
            return res.status(401).json({ error: 'Mot de passe incorrect' })

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
    } catch (err) {
        res.status(500).json({ err });
    }
}

exports.logout = async (req, res) => {
    res.cookie('token', null, { maxAge: 1 });
    res.status(200).json({ message: 'Déconnecté' })
}