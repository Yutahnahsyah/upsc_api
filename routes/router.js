import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../utils/fileUpload.js';

import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import * as stallController from '../controllers/stallController.js';
import * as vendorController from '../controllers/vendorController.js';
import * as adminController from '../controllers/adminController.js';
import * as menuController from '../controllers/menuController.js';
import * as orderController from '../controllers/orderController.js';
import * as cartController from '../controllers/cartController.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

router.use((req, res, next) => {
  const silentRoutes = [
    '/stalls/active',
    '/allMenuItems',
    '/getUser',
    '/stallMenu/',
    '/myCart',
    '/myOrders'
  ];

  const isSilent = silentRoutes.some(route => req.url.startsWith(route));
  if (isSilent || (req.method === 'GET' && req.url === '/getUser')) return next();

  const time = new Date().toLocaleTimeString();
  const method = req.method;
  const url = req.url;

  console.log(`\n==================== [${time}] ${method} ${url} ====================`);

  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", JSON.stringify(req.body, null, 2));
  } else if (method !== 'GET') {
    console.log("Body: [Empty]");
  }

  next();
});

// ===================== AUTH ROUTES =====================
router.post('/loginUser', authController.loginUser);
router.post('/loginAdmin', authController.loginAdmin);
router.post('/loginVendor', authController.loginVendor);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/verifyOtp', authController.verifyOtp);
router.post('/resetPassword', authController.resetPassword);

// ===================== USER ROUTES =====================
router.post('/registerUser', userController.registerUser);
router.get('/allUsers', authenticateToken, userController.getAllUsers);
router.get('/getUser', authenticateToken, userController.getUserProfile);
router.put('/editUser', authenticateToken, userController.editUserProfile);
router.post('/uploadProfilePic', authenticateToken, upload.single('image'), userController.updateProfilePicture);
router.delete('/deleteUser', authenticateToken, userController.deleteUser);
router.patch('/archiveUser', authenticateToken, userController.archiveUser);
router.post('/saveFcmToken', authenticateToken, userController.saveFcmToken);

// ===================== VENDOR ROUTES =====================
router.post('/registerVendor', authenticateToken, vendorController.registerVendor);
router.get('/allVendors', authenticateToken, vendorController.getAllVendors);
router.get('/vendorStall', authenticateToken, vendorController.getVendorStall);
router.put('/updateVendor/:admin_id', authenticateToken, vendorController.updateVendor);
router.patch('/changeVendorPassword', authenticateToken, vendorController.changeVendorPassword);
router.delete('/archiveVendor', authenticateToken, vendorController.archiveVendor);
router.delete('/deleteVendor', authenticateToken, vendorController.deleteVendor);

// ===================== ADMIN ROUTES =====================
router.post('/registerAdmin', authenticateToken, adminController.registerAdmin);
router.get('/adminDashboard', authenticateToken, adminController.getAdminDashboard);

// ===================== STALL ROUTES =====================
router.get('/stalls/active', stallController.getActiveStalls);
router.get('/stalls', stallController.getAllStalls);
router.get('/allStalls', authenticateToken, stallController.getAllStalls);
router.post('/createStall', authenticateToken, stallController.createStall);
router.patch('/stalls/update/:id', authenticateToken, upload.single('image'), stallController.updateStallProfile);
router.put('/updateStallProfile/:id', authenticateToken, stallController.updateStallProfile);
router.patch('/updateStallActiveStatus', authenticateToken, stallController.updateStallActiveStatus);
router.patch('/updateStallStatus', authenticateToken, stallController.updateStallActiveStatus);
router.patch('/updateStallOpenStatus', authenticateToken, stallController.updateStallOpenStatus);
router.delete('/deleteStall', authenticateToken, stallController.deleteStall);
router.get('/vendorDashboard', authenticateToken, stallController.getStallDashboard);
router.get('/stallStats', authenticateToken, stallController.getStallStats);

// ===================== MENU ROUTES =====================
router.get('/allMenuItems', menuController.getAllItems);
router.get('/stalls/:stallId/foods', menuController.getStallMenu);
router.get('/stallMenu/:stallId', menuController.getStallMenu);
router.post('/addItem', authenticateToken, upload.single('image'), menuController.addItem);
router.patch('/updateItem/:id', upload.single('image'), authenticateToken, menuController.updateMenuItem);
router.delete('/deleteItem/:id', authenticateToken, menuController.deleteMenuItem);

// ===================== CART ROUTES =====================
router.get('/myCart', authenticateToken, cartController.getUserCart);
router.post('/addToCart', authenticateToken, cartController.addItemToCart);
router.put('/updateCartItem/:cartItemId', authenticateToken, cartController.updateCartItem);
router.delete('/removeFromCart/:cartItemId', authenticateToken, cartController.removeCartItem);
router.delete('/clearStallCart/:stallId', authenticateToken, cartController.clearStallCart);
router.get('/validateCart', authenticateToken, cartController.validateCart);

// ===================== ORDER ROUTES =====================
router.post('/placeOrder', authenticateToken, orderController.placeOrder);
router.get('/myOrders', authenticateToken, orderController.getUserOrders);
router.get('/vendorOrders', authenticateToken, orderController.getStallOrders);
router.patch('/updateOrderStatus', authenticateToken, orderController.updateOrderStatus);

// ===================== NOTIFICATION ROUTES =====================
router.get('/notifications', authenticateToken, notificationController.getNotifications);

export default router;