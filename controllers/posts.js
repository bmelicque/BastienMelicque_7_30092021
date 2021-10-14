const db = require('../config/db');
const fs = require('fs').promises;
const { checkAuthorization } = require('../utils/functions');

const findPost = async (postId) => {
    const sql = `SELECT * FROM posts WHERE id = ?`;
    const [post] = await (await db).query(sql, postId);
    if (!post) throw 'POST_NOT_FOUND';
    else return post;
}

exports.getAllPosts = async (req, res) => {
    try {
        const sql = `SELECT * FROM posts ORDER BY date DESC`;
        const posts = await (await db).query(sql);
        res.status(200).json({ posts });
    } catch (error) {
        res.status(500).json({ error });
    }
}

exports.createPost = async (req, res) => {
    try {
        const mediaUrl = (req.file) ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : null;
        const { text } = req.body;
        const { userId } = res.locals;
        const sql = `INSERT INTO posts (userId, text, mediaUrl) VALUES (?, ?, ?)`;
        await (await db).query(sql, [userId, text, mediaUrl]);
        res.status(201).json({ message: 'Post enregistré' });
    } catch (error) {
        res.status(500).json({ error });
    }
}

exports.editPost = async (req, res) => {
    try {
        // Checking if the post exists within the database
        const post = await findPost(req.params.id);

        // Checking if the user has authorization to edit the post
        checkAuthorization(res, post.userId);

        // Updating the database
        const sql = `UPDATE posts SET text = ? WHERE id = ?`;
        await (await db).query(sql, [req.body.text, post.id]);
        res.status(200).json({ message: 'Post modifié' });
    } catch (error) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}

exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;

        // Checking if the post still exists within the database
        const post = await findPost(postId);

        // Checking if the user has authorization to edit the post
        checkAuthorization(res, post.userId);

        if (post.mediaUrl) {
            const filename = post.mediaUrl.split('/images/')[1];
            await fs.unlink(`images/${filename}`);
        }

        // Deleting from database
        const sql = `DELETE FROM posts WHERE id = ?`;
        await (await db).query(sql, postId);
        res.status(200).json({ message: 'Post supprimé' });
    } catch (error) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}

exports.likePost = async (req, res) => {
    try {
        const { userId, like } = req.body;
        const post = await findPost(req.params.id);

        let usersLiked = post.usersLiked ? post.usersLiked.split(' ') : [];
        usersLiked = usersLiked.filter(user => user != userId);
        if (like) usersLiked.push(userId);

        const sql = `UPDATE posts SET usersLiked = ? WHERE id = ?`;
        await (await db).query(sql, [usersLiked.join(' '), post.id]);
        res.status(200).json({ usersLiked });
    } catch (error) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}