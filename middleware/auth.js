const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Compares the provided ID with the one in the token to ensure security
module.exports = async (req, res, next) => {
    try {
        // Checking if the user has a token
        const token = req.cookies.token;
        if (!token)
            throw 'Requête non authentifiée'

        // Checking if the user's ID is still correct
        const decodedToken = jwt.verify(token, process.env.TOKEN_PRIVATE_KEY);
        const sql = `SELECT * FROM users WHERE users.id = '${decodedToken.userId}'`;
        const [user] = await (await db).query(sql);
        if (!user)
            throw 'ID utilisateur non valable'

        // Saving the ID and role locally
        res.locals.userId = user.id;
        res.locals.userRole = user.role;
        next();
    } catch (error) {
        res.locals.userId = null;
        res.locals.userRole = null;
        res.cookie('token', null, { maxAge: 1 });
        res.status(403).json({ error });
    }
}