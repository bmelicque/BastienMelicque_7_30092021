const db = require('../config/db');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const zxcvbn = require('zxcvbn');
const { errorHandler } = require('../utils/functions');

const findUserByMail = async (email) => {
    const sql = `SELECT * FROM users WHERE users.email = ?`;
    const [user] = await (await db).query(sql, email);
    return user;
}

// On signup, the email is hashed to respect GDPR (no personal data stored on the server)
// The password is encrypted for security reasons
exports.signup = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Checking if the email is valid
        if (!isEmail(email))
            throw 'INVALID_EMAIL';

        // Checking email unicity
        if (await findUserByMail(email))
            throw 'INVALID_EMAIL';

        // Checking if the password is strong enough
        const { score } = zxcvbn(password, email);
        if (score <= 1)
            throw 'INVALID_PASSWORD';

        // Actual post to database
        const hash = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;
        await (await db).query(sql, [email, hash]);
        res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
        console.log(error);
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}


// Hashes the provided email to see if it exists in the database
// Then compares the provided password with the encrypted one in the database
// On success, provides a secured token to the user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Checking if email exists in the database
        const user = await findUserByMail(email)
        if (!user)
            throw 'INCORRECT_LOGIN';

        // Checking if the password is valid
        const valid = await bcrypt.compare(password, user.password)
        if (!valid)
            throw 'INCORRECT_LOGIN';

        // Sending token
        const maxAge = 2 * 86400000; // 2 days
        res.status(200).json({
            userId: user.id,
            userRole: user.role,
            token: jwt.sign(
                { userId: user.id, role: user.role },
                process.env.TOKEN_PRIVATE_KEY,
                { expiresIn: maxAge }
            )
        });
    } catch (error) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}