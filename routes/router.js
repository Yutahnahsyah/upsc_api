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

// ===================== STALL ROUTES =====================
router.post('/createStall', authenticateToken, stallController.createStall);
router.get('/allStalls', authenticateToken, stallController.getAllStalls);
router.patch('/updateStallStatus', authenticateToken, stallController.updateStallStatus);
router.delete('/deleteStall', authenticateToken, stallController.deleteStall);

// ===================== MENU ROUTES =====================
router.get('/stallMenu/:stallId', authenticateToken, menuController.getStallMenu);
router.post('/addItem', authenticateToken, upload.single('image'), menuController.addItem);
router.patch('/updateItem/:id', upload.single('image'), menuController.updateMenuItem);
router.delete('/deleteItem/:id', authenticateToken, menuController.deleteMenuItem);

// ===================== CART ROUTES =====================
// For students/staff to manage their current selection
router.get('/myCart', authenticateToken, cartController.getUserCart);
router.post('/addToCart', authenticateToken, cartController.addItemToCart);
router.delete('/removeFromCart/:cartItemId', authenticateToken, cartController.removeItem);

// ===================== ORDER ROUTES =====================
// Vendor Side: View and Manage orders
router.get('/vendorOrders', authenticateToken, orderController.getStallOrders);
router.patch('/updateOrderStatus', authenticateToken, orderController.updateOrderStatus);

// User Side: Placing the order
router.post('/placeOrder', authenticateToken, orderController.placeOrder);
router.get('/myOrders', authenticateToken, orderController.getUserOrders);

// ==================== VENDOR ROUTES =====================
router.post('/registerVendor', authenticateToken, vendorController.registerVendor);
router.get('/allVendors', authenticateToken, vendorController.getAllVendors);
router.delete('/deleteVendor', authenticateToken, vendorController.deleteVendor);

// ==================== ADMIN ROUTES =====================
router.post('/registerAdmin', authenticateToken, adminController.registerAdmin);
router.get('/adminDashboard', authenticateToken, adminController.getAdminDashboard);

export default router;