const express = require('express')
const router = express.Router();
const userCtrl = require('../controllers/user');

router.get('/:id', userCtrl.userInfo);
router.put('/:id', userCtrl.updateUser);
router.delete('/:id', userCtrl.deleteUser);

module.exports = router;