const db = require('../config/db');
const { errorHandler, checkAuthorization } = require('../utils/functions');

// Takes an id and return the corresponding user form DB
// Throws error 404 if not found
const findUser = async (id) => {
    const sql = `SELECT * FROM users WHERE users.id = ?`;
    const [user] = await (await db).query(sql, id);
    if (!user) throw {
        code: 404,
        message: 'Utilisateur inexistant'
    }
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
        errorHandler(err, res);
    }
}

// Updates user info
exports.updateUser = async (req, res) => {
    try {
        const { username, firstName, lastName } = req.body;
        const { id } = req.params;

        await findUser(req.params.id); // Ensures that the user is still in the DB
        checkAuthorization(res, req.params.id)

        // Checking if the new username isn't already used
        const usernameSQL = `SELECT * FROM users
        WHERE users.id <> ? AND users.username = ?`
        const [usernameIsUsed] = await (await db).query(usernameSQL, [id, username]);
        if (usernameIsUsed)
            return res.status(400).json({ error: "Nom d'utilisateur déjà utilisé" })

        // Updating user info
        const updateSQL = `UPDATE users SET first_name = ?, last_name = ?, username = ? WHERE id = ?`;
        await (await db).query(updateSQL, [firstName, lastName, username, id]);
        res.status(200).json({ message: "Données d'utilisateur modifiées" })
    } catch (err) {
        errorHandler(err, res);
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await findUser(id); // Ensures that the user is still in the DB
        checkAuthorization(res, id);
        const sql = `DELETE FROM users WHERE id = ?`
        await (await db).query(sql, id);
        res.status(200).json({ message: 'Utilisateur supprimé' })
    } catch (err) {
        errorHandler(err, res);
    }
}