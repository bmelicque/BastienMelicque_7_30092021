const db = require('../config/db');

// Used to get info on a user 
exports.userInfo = async (req, res) => {
    try {
        // Finding user in the database
        const sql = `SELECT * FROM users WHERE users.id = ${req.params.id}`;
        const [user] = await (await db).query(sql);
        if (!user)
            return res.status(404).json({ message: 'Utilisateur non trouvé' });

        // Returning user info (except the password)
        delete user.password;
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ err });
    }
}

// Updates user info
exports.updateUser = async (req, res) => {
    try {
        // Finding the user in the database
        const sql = `SELECT * FROM users WHERE users.id = ${req.params.id}`;
        const [user] = await (await db).query(sql);
        if (!user)
            return res.status(404).json({ message: 'Utilisateur non trouvé' });

        // A user can only update itself. Admins can update anyone
        if (!(res.locals.userId == req.params.id || res.locals.userRole == 'admin'))
            return res.status(403).json({ error: "Accès refusé" });

        // Checking if the new username isn't already used
        const usernameSQL = `SELECT * FROM users
        WHERE users.id <> "${req.params.id}" AND users.username = "${req.body.username}"`
        const [username] = await (await db).query(usernameSQL);
        if (username)
            return res.status(400).json({ error: "Nom d'utilisateur déjà utilisé" })

        // Updating user info
        const updateSQL = `UPDATE users
        SET first_name = "${req.body.firstName}", last_name = "${req.body.lastName}"
        WHERE id = ${req.params.id}`;
        await (await db).query(updateSQL);
        res.status(200).json({ message: "Données d'utilisateur modifiées" })
    } catch (err) {
        res.status(500).json({ err });
    }
}

exports.deleteUser = async (req, res) => {
    try {
        // Finding user in the database
        const findSQL = `SELECT * FROM users WHERE users.id = ${req.params.id}`;
        const [user, ...rest] = await (await db).query(findSQL);
        if (!user)
            return res.status(404).json({ message: 'Utilisateur non trouvé' });

        // A user can only delete itself. Admins can delete any profile
        if (!(req.body.userId == req.params.id || req.body.userRole == 'admin'))
            return res.status(403).json({ error: "Accès refusé" });

        // Actual deleting of profile
        const deleteSQL = `DELETE FROM users WHERE id = "${req.params.id}"`
        await (await db).query(deleteSQL);
        res.status(200).json({ message: 'Utilisateur supprimé' })
    } catch (err) {
        res.status(500).json({ err });
    }
}