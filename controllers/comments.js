const db = require('../config/db');
const { errorHandler, checkAuthorization } = require('../utils/functions');

const findComment = async (commentId) => {
    const sql = `SELECT * FROM comments WHERE id = ?`;
    const [comment] = await (await db).query(sql, commentId);
    if (!comment) throw 'COMMENT_NOT_FOUND';
    else return comment;
}

// Gets all comments liked to a post
exports.getComments = async (req, res) => {
    try {
        const sql = `SELECT * FROM comments WHERE postId = ? ORDER BY date DESC`;
        const comments = await (await db).query(sql, req.params.postId);
        res.status(200).json({ comments });
    } catch (error) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}

exports.createComment = async (req, res) => {
    try {
        const { text } = req.body;
        const { postId } = req.params;
        const { userId } = res.locals;
        const sql = `INSERT INTO comments (postId, userId, text) VALUES (?, ?, ?)`;
        const { insertId } = await (await db).query(sql, [postId, userId, text]);
        res.status(201).json(await findComment(insertId));
    } catch (error) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}

exports.editComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { text } = req.body;
        const comment = await findComment(commentId);
        checkAuthorization(res, comment.userId);

        // Updating the database
        const sql = `UPDATE comments SET text = ? WHERE id = ?`;
        await (await db).query(sql, [text, commentId]);
        res.status(200).json({ message: 'Commentaire modifié' });
    } catch (err) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}

exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await findComment(commentId);

        // Checking if the user has authorization to edit the post
        checkAuthorization(res, comment.userId);

        // Deleting from database
        const sql = `DELETE FROM comments WHERE id = ?`;
        await (await db).query(sql, commentId);
        res.status(200).json({ message: 'Commentaire supprimé' });
    } catch (error) {
        const { code, message } = errorHandler(error);
        res.status(code).json({ message });
    }
}