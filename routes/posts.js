const express = require('express');
const router = express.Router();
const postsCtrl = require('../controllers/posts');
const auth = require('../middleware/auth');

router.get('/', auth, postsCtrl.getAllPosts);
router.post('/', auth, postsCtrl.createPost);
router.put('/:id', auth, postsCtrl.editPost);
router.delete('/:id', auth, postsCtrl.deletePost);
router.post('/:id/like', auth, postsCtrl.likePost);

module.exports = router;