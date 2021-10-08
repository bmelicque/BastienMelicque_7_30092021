const express = require('express');
const router = express.Router();
const commentsCtrl = require('../controllers/comments');
const auth = require('../middleware/auth');

router.get('/:postId', auth, commentsCtrl.getComments);
router.post('/:postId', auth, commentsCtrl.createComment);
router.put('/:commentId', auth, commentsCtrl.editComment);
router.delete('/:commentId', auth, commentsCtrl.deleteComment);

module.exports = router;