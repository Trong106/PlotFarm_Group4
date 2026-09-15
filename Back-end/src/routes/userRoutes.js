const router = require('express').Router();
const controller = require('../controllers/userController');
const { verifyToken, checkRole, ROLES } = require('../middlewares/authMiddleware');
const { requireActiveAdmin } = require('../middlewares/adminMiddleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validateMiddleware');
const { listUsersQuerySchema } = require('../validators/adminUserValidator');
const adminUserController = require('../controllers/adminUserController');
const { updateProfileSchema, createAddressSchema, updateAddressSchema, addressParamsSchema } = require('../validators/userValidator');

router.use(verifyToken);
router.get('/', checkRole(ROLES.ADMIN), validateQuery(listUsersQuerySchema), requireActiveAdmin, adminUserController.listUsers);
router.get('/me', controller.loadCurrentUser, controller.getProfile);
router.patch('/me', validateBody(updateProfileSchema), controller.loadCurrentUser, controller.updateProfile);
router.post('/me/change-password', controller.loadCurrentUser, controller.changePassword);
router.get('/me/addresses', controller.loadCurrentUser, controller.listAddresses);
router.post('/me/addresses', validateBody(createAddressSchema), controller.loadCurrentUser, controller.createAddress);
router.get('/me/addresses/:addressId', validateParams(addressParamsSchema), controller.loadCurrentUser, controller.getAddress);
router.patch('/me/addresses/:addressId', validateParams(addressParamsSchema), validateBody(updateAddressSchema), controller.loadCurrentUser, controller.updateAddress);
router.delete('/me/addresses/:addressId', validateParams(addressParamsSchema), controller.loadCurrentUser, controller.deleteAddress);

module.exports = router;
