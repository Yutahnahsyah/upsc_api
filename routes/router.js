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

const router = express.Router();

router.use((req, res, next) => {
  if (req.method === 'GET' && req.url === '/getUser') return next();
  
  const time = new Date().toLocaleTimeString();
  const method = req.method;
  const url = req.url;

  console.log(`\n--- [${time}] ${method} ${url} ---`);

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

// ===================== USER ROUTES =====================
router.post('/registerUser', userController.registerUser);
router.get('/allUsers', authenticateToken, userController.getAllUsers);
router.get('/getUser', authenticateToken, userController.getUserProfile);
router.put('/editUser', authenticateToken, userController.editUserProfile);
router.post('/uploadProfilePic', authenticateToken, upload.single('image'), userController.updateProfilePicture);
router.delete('/deleteUser', authenticateToken, userController.deleteUser);
router.patch('/archiveUser', authenticateToken, userController.archiveUser);

// ===================== STALL ROUTES =====================
router.post('/createStall', authenticateToken, stallController.createStall);
router.get('/allStalls', authenticateToken, stallController.getAllStalls);
router.patch('/updateStallStatus', authenticateToken, stallController.updateStallStatus);
router.delete('/deleteStall', authenticateToken, stallController.deleteStall);
router.get('/stalls', stallController.getAllStalls);
router.get('/stalls/active', stallController.getActiveStalls);
router.get('/stallMenu/:stallId', menuController.getStallMenu);
router.patch('/stalls/update/:id', authenticateToken, upload.single('image'), stallController.updateStallProfile);
router.put('/updateStallProfile/:id', authenticateToken, stallController.updateStallProfile);

// ===================== MENU ROUTES =====================
router.get('/stalls/:stallId/foods', menuController.getStallMenu);
router.get('/allMenuItems', menuController.getAllItems);
router.post('/addItem', authenticateToken, upload.single('image'), menuController.addItem);
router.patch('/updateItem/:id', upload.single('image'), authenticateToken, menuController.updateMenuItem);
router.delete('/deleteItem/:id', authenticateToken, menuController.deleteMenuItem);

// ===================== CART ROUTES =====================
router.get('/myCart', authenticateToken, cartController.getUserCart);
router.post('/addToCart', authenticateToken, cartController.addItemToCart);
router.delete('/removeFromCart/:cartItemId', authenticateToken, cartController.removeItem);
router.delete('/clearStallCart/:stallId', authenticateToken, cartController.clearStallCart);

// ===================== ORDER ROUTES =====================
router.get('/vendorOrders', authenticateToken, orderController.getStallOrders);
router.patch('/updateOrderStatus', authenticateToken, orderController.updateOrderStatus);
router.post('/placeOrder', authenticateToken, orderController.placeOrder);
router.get('/myOrders', authenticateToken, orderController.getUserOrders);

// ==================== VENDOR ROUTES =====================
router.post('/registerVendor', authenticateToken, vendorController.registerVendor);
router.get('/allVendors', authenticateToken, vendorController.getAllVendors);
router.delete('/archiveVendor', authenticateToken, vendorController.archiveVendor);
router.get('/vendorStall', authenticateToken, vendorController.getVendorStall);
router.get('/vendorDashboard', authenticateToken, vendorController.getVendorDashboard);
router.patch('/changeVendorPassword', authenticateToken, vendorController.changeVendorPassword);
router.put('/updateVendor/:admin_id', authenticateToken, vendorController.updateVendor);
router.delete('/deleteVendor', authenticateToken, vendorController.deleteVendor);

// ==================== ADMIN ROUTES =====================
router.post('/registerAdmin', authenticateToken, adminController.registerAdmin);
router.get('/adminDashboard', authenticateToken, adminController.getAdminDashboard);

export default router;