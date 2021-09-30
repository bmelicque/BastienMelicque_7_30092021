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
        console.log(sql);

        db.connect((err) => {
            if (err) throw err;
        });

        db.query(sql, (err) => {
            if (err) res.status(400).json({ err });
            else res.status(201).json({ message: 'Utilisateur créé avec succès' });
        })

        db.end();

    } catch (err) {
        res.status(500).json({ err })
    }
}


// Hashes the provided email to see if it exists in the database
// Then compares the provided password with the encrypted one in the database
// On success, provides a secured token to the user
exports.login = async (req, res, next) => {
    const hashedEmail = cryptoJS.SHA3(req.body.email).toString();
    const findUserSQL = `SELECT * FROM users WHERE users.email = '${hashedEmail}'`;

    db.connect((err) => {
        if (err) return res.status(500).json({ err });
    });

    db.query(findUserSQL, (err, results) => {
        if (err) return res.status(500).json({ err });

        if (!results) {
            return res.status(401).json({ message: 'Utilisateur inexistant' })
        }

        bcrypt.compare(req.body.password, results[0].password)
            .then(isValid => {
                if (!isValid) {
                    return res.status(401).json({ error: 'Mot de passe incorrect !' })
                }

                res.status(200).json({
                    userId: results[0].id,
                    token: jwt.sign(
                        { userId: results[0].id, role: results[0].role },
                        process.env.TOKEN_PRIVATE_KEY,
                        { expiresIn: '48h' }
                    )
                })
            })
            .catch(err => res.status(500).json({ err }))
    });
    db.end();
}