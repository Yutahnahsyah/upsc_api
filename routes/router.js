import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../utils/fileUpload.js';

import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import * as stallController from '../controllers/stallController.js';
import * as vendorController from '../controllers/vendorController.js';
import * as adminController from '../controllers/adminController.js';

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

// ==================== VENDOR ROUTES =====================
router.post('/registerVendor', authenticateToken, vendorController.registerVendor);
router.get('/allVendors', authenticateToken, vendorController.getAllVendors);
router.delete('/deleteVendor', authenticateToken, vendorController.deleteVendor);

// ==================== ADMIN ROUTES =====================
router.post('/registerAdmin', authenticateToken, adminController.registerAdmin);
router.get('/adminDashboard', authenticateToken, adminController.getAdminDashboard);

export default router;