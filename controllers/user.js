const db = require('../config/db');
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');
const { errorHandler, checkAuthorization } = require('../utils/functions');

// Takes an id and return the corresponding user form DB
// Throws error 404 if not found
const findUser = async (id) => {
    const sql = `SELECT * FROM users WHERE users.id = ?`;
    const [user] = await (await db).query(sql, id);
    if (!user) throw 'USER_NOT_FOUND';
    else return user;
}

// Gets info on one user. Returns all info except the password and the email. 
exports.userInfo = async (req, res) => {
    try {
        const user = await findUser(req.params.id)
        delete user.password;
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error })
    }
}

exports.getAllUsers = async (req, res) => {
    try {
        const sql = 'SELECT * FROM users';
        const users = await (await db).query(sql);
        users.forEach(user => delete user.password);
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error })
    }
}

// Updates user info
exports.updateUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { id } = req.params;

        checkAuthorization(res, id);

        // Checking if the new email isn't already used
        const emailSQL = `SELECT * FROM users
        WHERE users.id <> ? AND users.email = ?`
        const [emailIsUsed] = await (await db).query(emailSQL, [id, email]);
        if (emailIsUsed)
            throw 'INVALID_EMAIL';

        // Checking if the password is strong enough
        const { score } = zxcvbn(password, email);
        if (score <= 1)
            throw 'INVALID_PASSWORD';

        const hash = await bcrypt.hash(password, 10);

        // Updating user info
        const updateSQL = `UPDATE users SET email = ?, password = ? WHERE id = ?`;
        await (await db).query(updateSQL, [email, hash, id]);
        res.status(200).json({ message: "Données d'utilisateur modifiées" });
    } catch (error) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        checkAuthorization(res, id);
        const user = await findUser(id);
        if (user.role === 'admin')
            throw 'UNAUTHORIZED';
        const sql = `DELETE FROM users WHERE id = ?`
        await (await db).query(sql, id);
        res.status(200).json({ message: 'Utilisateur supprimé' })
    } catch (error) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}