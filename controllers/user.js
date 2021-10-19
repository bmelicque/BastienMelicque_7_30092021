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

// Updates the password of a user
// A user can only update itself, and only if they know their current passsword
exports.updatePassword = async (req, res) => {
    try {
        const { password, newPassword } = req.body;
        const { userId } = res.locals; // Id of the user authenticated

        const user = await findUser(userId);

        // Checking if the given password is valid
        const valid = await bcrypt.compare(password, user.password)
        if (!valid)
            throw 'INCORRECT_LOGIN';

        // Checking if the password is strong enough
        const { score } = zxcvbn(newPassword, user);
        if (score <= 1)
            throw 'INVALID_PASSWORD';

        const hash = await bcrypt.hash(newPassword, 10);

        // Updating user info
        const sql = `UPDATE users SET password = ? WHERE id = ?`;
        await (await db).query(sql, [hash, userId]);
        res.status(200).json({ message: "Données d'utilisateur modifiées" });

    } catch (error) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}

// Deletes a user
// The password is needed
// An admin cannot suppress its account
exports.deleteUser = async (req, res) => {
    try {
        const { userId, userRole } = res.locals;
        const { password } = req.body;
        
        if (userRole === 'admin')
            throw 'UNAUTHORIZED';

        const user = await findUser(userId);

        const passwordIsValid = await bcrypt.compare(password, user.password);
        if (!passwordIsValid) throw 'INCORRECT_LOGIN';

        const sql = `DELETE FROM users WHERE id = ?`;
        await (await db).query(sql, userId);
        res.status(200).json({ message: 'Utilisateur supprimé' });
    } catch (error) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}