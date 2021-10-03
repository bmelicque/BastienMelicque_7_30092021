const db = require('../config/db');

exports.getAllPosts = async (req, res) => {
    try {
        const sql = `SELECT * FROM posts ORDER BY date DESC`;
        const data = await (await db).query(sql);
        res.status(200).json({ data });
    } catch (err) {
        res.status(500).json({ err })
    }
}

exports.createPost = async (req, res) => {
    try {
        const { userId, text, media } = req.body;
        const sql = `INSERT INTO posts (userId, text, media) VALUES (?, ?, ?)`;
        await (await db).query(sql, [userId, text, media]);
        res.status(201).json({ message: 'Post envoyé' })
    } catch (err) {
        res.status(500).json({ err })
    }
}

exports.editPost = async (req, res) => {
    try {
        // Checking if the post exists within the database
        const checkSQL = `SELECT * FROM posts WHERE id = ?`
        const post = await (await db).query(checkSQL, req.params.id);
        if (!post)
            return res.status(404).json({ error: 'Post inexistant' })

        // Checking if the user has authorization to edit the post
        if (post.userId != res.locals.userId || res.locals.userRole != 'admin')
            return res.status(403).json({ error: "Vous n'êtes pas autorisés à modifier cette ressource" })

        // Updating the database
        const sql = `UPDATE posts SET text = ?`;
        await (await db).query(sql, req.body.text);
        res.status(200).json({ message: 'Post modifié' })
    } catch (err) {
        res.status(500).json({ err })
    }
}

exports.deletePost = async (req, res) => {
    try {
        // Checking if the post exists within the database
        const checkSQL = `SELECT * FROM posts WHERE id = ?`
        const post = await (await db).query(checkSQL, req.params.id);
        if (!post)
            return res.status(404).json({ error: 'Post inexistant' })

        // Checking if the user has authorization to edit the post
        if (post.userId != res.locals.userId || res.locals.userRole != 'admin')
            return res.status(403).json({ error: "Vous n'êtes pas autorisés à modifier cette ressource" })

        // Deleting from database
        const sql = `DELETE FROM posts WHERE id = ?`;
        await (await db).query(sql, req.params.id);
        res.status(200).json({ message: 'Post supprimé' });
    } catch (err) {
        res.status(500).json({ err })
    }
}