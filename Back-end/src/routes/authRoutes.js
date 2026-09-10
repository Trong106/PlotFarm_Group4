const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validateBody } = require('../middlewares/validateMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidator');

router.post('/register', validateBody(registerSchema, 'Dữ liệu đăng ký không hợp lệ'), authController.register);
router.post('/login', validateBody(loginSchema, 'Dữ liệu đăng nhập không hợp lệ'), authController.login);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
