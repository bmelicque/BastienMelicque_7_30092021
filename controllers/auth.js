const { isEmail } = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoJS = require('crypto-js');
const db = require('../config/db');


// On signup, the email is hashed to respect GDPR (no personal data stored on the server)
// The password is encrypted for security reasons
exports.signup = async (req, res, next) => {
    try {
        // Checking if the email is valid
        if (!isEmail(req.body.email))
            return res.status(400).json({ error: 'Adresse email incorrecte' });

        const hashedEmail = cryptoJS.SHA3(req.body.email).toString();

        // Checking email unicity
        const emailSQL = `SELECT * FROM users WHERE users.email = '${hashedEmail}'`;
        const [emailIsUnique] = await (await db).query(emailSQL);
        if (emailIsUnique)
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });

        // Checking username unicity
        const userSQL = `SELECT * FROM users WHERE users.username = '${req.body.username}'`;
        const [user] = await (await db).query(userSQL);
        if (user)
            return res.status(400).json({ error: 'Ce pseudo est déjà utilisé' });

        // Actual post to database
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const sql = `INSERT INTO users (username, email, password) VALUES ('${req.body.username}', '${hashedEmail}', '${hashedPassword}')`;
        await (await db).query(sql)
        res.status(201).json({ message: 'Utilisateur créé avec succès' })
    } catch (err) {
        res.status(500).json({ err })
    }
}


// Hashes the provided email to see if it exists in the database
// Then compares the provided password with the encrypted one in the database
// On success, provides a secured token to the user
exports.login = async (req, res, next) => {
    try {
        // Checking if email exists in the database
        const hashedEmail = cryptoJS.SHA3(req.body.email).toString();
        const sql = `SELECT * FROM users WHERE users.email = '${hashedEmail}'`;
        const [user] = await (await db).query(sql);
        if (!user)
            return res.status(401).json({ error: 'Utilisateur inexistant' })

        // Checking if the password is valid
        const valid = await bcrypt.compare(req.body.password, user.password)
        if (!valid)
            return res.status(401).json({ error: 'Mot de passe incorrect' })

        // Sending token
        const maxAge = 48 * 86400000;
        res.cookie('token', jwt.sign(
            { userId: user.id, role: user.role },
            process.env.TOKEN_PRIVATE_KEY,
            { expiresIn: maxAge }
        ), {
            httpOnly: true,
            maxAge: maxAge
        })
        res.status(200).json({ userId: user.id })
    } catch (err) {
        res.status(500).json({ err });
    }
}

exports.logout = async (req, res) => {
    res.cookie('token', null, { maxAge: 1 });
    res.status(200).json({ message: 'Déconnecté' })
}