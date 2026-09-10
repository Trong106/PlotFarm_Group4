const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validateBody } = require('../middlewares/validateMiddleware');
const { registerSchema } = require('../validators/authValidator');

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
