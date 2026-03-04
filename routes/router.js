import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../utils/fileUpload.js';
import { registerUser, loginUser, registerAdmin, loginAdmin, registerVendor, loginVendor, createStall } from '../controllers/auth/authController.js';
import { getAllUsers, getAllStalls, getAllVendors } from '../controllers/users/displayController.js';
import { getUserProfile, editUserProfile, updateProfilePicture, deleteUser } from '../controllers/users/userController.js';
import { updateStallStatus, deleteStall } from '../controllers/users/stallController.js';
import { deleteVendor } from '../controllers/users/vendorController.js';

const router = express.Router();

// ===================== AUTH ROUTES =====================
router.post('/registerUser', registerUser);
router.post('/loginUser', loginUser);
router.post('/registerAdmin', registerAdmin);
router.post('/loginAdmin', loginAdmin);
router.post('/registerVendor', registerVendor);
router.post('/loginVendor', loginVendor);
router.post('/createStall', createStall);

// =================== DISPLAY ROUTES ====================
router.get('/allUsers', authenticateToken, getAllUsers);
router.get('/allStalls', authenticateToken, getAllStalls);
router.get('/allVendors', authenticateToken, getAllVendors);

// ==================== USER ROUTES ======================
router.get('/getUser', authenticateToken, getUserProfile);
router.put('/editUser', authenticateToken, editUserProfile);
router.post('/uploadProfilePic', authenticateToken, upload.single('image'), updateProfilePicture);
router.delete('/deleteUser', deleteUser);

// ==================== STALL ROUTES =====================
router.patch('/updateStallStatus', authenticateToken, updateStallStatus);
router.delete('/deleteStall', deleteStall);

// =================== VENDOR ROUTES =====================
router.delete('/deleteVendor', deleteVendor);

export default router;