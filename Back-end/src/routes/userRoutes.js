const router = require('express').Router();
const controller = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validateBody, validateParams } = require('../middlewares/validateMiddleware');
const { updateProfileSchema, createAddressSchema, updateAddressSchema, addressParamsSchema } = require('../validators/userValidator');

router.use(verifyToken);
router.get('/me', controller.loadCurrentUser, controller.getProfile);
router.patch('/me', validateBody(updateProfileSchema), controller.loadCurrentUser, controller.updateProfile);
router.get('/me/addresses', controller.loadCurrentUser, controller.listAddresses);
router.post('/me/addresses', validateBody(createAddressSchema), controller.loadCurrentUser, controller.createAddress);
router.get('/me/addresses/:addressId', validateParams(addressParamsSchema), controller.loadCurrentUser, controller.getAddress);
router.patch('/me/addresses/:addressId', validateParams(addressParamsSchema), validateBody(updateAddressSchema), controller.loadCurrentUser, controller.updateAddress);
router.delete('/me/addresses/:addressId', validateParams(addressParamsSchema), controller.loadCurrentUser, controller.deleteAddress);

module.exports = router;
