const db = require('../config/db');
const { errorHandler, checkAuthorization } = require('../utils/functions');

const findPost = async (postId) => {
    const sql = `SELECT * FROM posts WHERE id = ?`;
    const [post] = await (await db).query(sql, postId);
    if (!post) throw {
        code: 404,
        message: 'Post inexistant !'
    };
    else return post;
}

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
        errorHandler(err, res);
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
        res.status(200).json({ message: 'Post modifié' })
    } catch (err) {
        errorHandler(err, res);
    }
}

exports.deletePost = async (req, res) => {
    try {
        // Checking if the post still exists within the database
        const post = await findPost(req.params.id)

        // Checking if the user has authorization to edit the post
        checkAuthorization(res, post.userId);

        // Deleting from database
        const sql = `DELETE FROM posts WHERE id = ?`;
        await (await db).query(sql, req.params.id);
        res.status(200).json({ message: 'Post supprimé' });
    } catch (err) {
        errorHandler(err, res);
    }
}

exports.likePost = async (req, res) => {
    try {
        const { userId, like } = req.body;
        const post = await findPost(req.params.id);

        let usersLiked = post.usersLiked ? post.usersLiked.split(' ') : [];
        usersLiked = usersLiked.filter(user => user != userId);
        if (like) usersLiked.push(userId)

        const sql = `UPDATE posts SET usersLiked = ? WHERE id = ?`
        await (await db).query(sql, [usersLiked.join(' '), post.id])
        res.status(200).json({ usersLiked });
    } catch (err) {
        errorHandler(err, res);
    }
}