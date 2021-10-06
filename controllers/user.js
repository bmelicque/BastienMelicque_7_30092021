const db = require('../config/db');
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');
const { checkAuthorization } = require('../utils/functions');

// Takes an id and return the corresponding user form DB
// Throws error 404 if not found
const findUser = async (id) => {
    const sql = `SELECT * FROM users WHERE users.id = ?`;
    const [user] = await (await db).query(sql, id);
    if (!user) res.status(404).json({ error: 'Utilisateur inexistant' })
    else return user;
}

// Gets info on one user. Returns all info except the password and the email. 
exports.userInfo = async (req, res) => {
    try {
        user = await findUser(req.params.id)
        delete user.email;
        delete user.password;
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error })
    }
}

// Updates user info
exports.updateUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { id } = req.params;

        checkAuthorization(res, req.params.id)

        // Checking if the new email isn't already used
        const emailSQL = `SELECT * FROM users
        WHERE users.id <> ? AND users.email = ?`
        const [emailIsUsed] = await (await db).query(emailSQL, [id, email]);
        if (emailIsUsed)
            throw "Cette adresse email est déjà utilisée";

        // Checking if the password is strong enough
        const { score } = zxcvbn(password, [username, email]);
        if (score <= 1)
            throw 'Mot de passe invalide (trop faible)';

        const hash = await bcrypt.hash(password, 10);

        // Updating user info
        const updateSQL = `UPDATE users SET email = ?, password = ? WHERE id = ?`;
        await (await db).query(updateSQL, [email, hash, id]);
        res.status(200).json({ message: "Données d'utilisateur modifiées" })
    } catch (error) {
        if (error.includes('email') || error.includes('passe'))
            res.status(400).json({ error });
        else res.status(500).json({ error });
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        checkAuthorization(res, id);
        const user = findUser(id);
        if (user.role === 'admin')
            res.status(403).json({ error: 'Requête non autorisée' });
        const sql = `DELETE FROM users WHERE id = ?`
        await (await db).query(sql, id);
        res.status(200).json({ message: 'Utilisateur supprimé' })
    } catch (error) {
        res.status(500).json({ error });
    }
}