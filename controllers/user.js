const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoJS = require('crypto-js');
const db = require('../config/db');


// On signup, the email is hashed to respect GDPR (no personal data stored on the server)
// Emails have a unicity constraint within the database
// The password is encrypted for security reasons
exports.signup = async (req, res, next) => {
    try {
        const hashedEmail = cryptoJS.SHA3(req.body.email).toString();
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        
        const sql = `INSERT INTO users (username, email, password) VALUES ('${req.body.username}', '${hashedEmail}', '${hashedPassword}')`;

        (await db).query(sql)
            .then(res.status(201).json({ message: 'Utilisateur créé avec succès' }))

    } catch (err) {
        res.status(500).json({ err })
    }
}


// Hashes the provided email to see if it exists in the database
// Then compares the provided password with the encrypted one in the database
// On success, provides a secured token to the user
exports.login = async (req, res, next) => {
    try {
        const hashedEmail = cryptoJS.SHA3(req.body.email).toString();
        const findUserSQL = `SELECT * FROM users WHERE users.email = '${hashedEmail}'`;

        const user = await (await db).query(findUserSQL);
        if (!user) return res.status(401).json({ error: 'Utilisateur inexistant' })

        const valid = await bcrypt.compare(req.body.password, user[0].password)
        if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' })

        res.status(200).json({
            userId: user[0].id,
            token: jwt.sign(
                { userId: user[0].id, role: user[0].role },
                process.env.TOKEN_PRIVATE_KEY,
                { expiresIn: '48h' }
            )
        })
    } catch (err) {
        res.status(500).json({ err });
    }
}