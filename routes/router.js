import express from 'express';
import { registerUser, loginUser } from '../controllers/auth/authController.js';
import { getUserProfile, editUserProfile, updateProfilePicture, deleteUser } from '../controllers/users/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../utils/fileUpload.js';

const router = express.Router();

// ===================== AUTH ROUTES =====================
router.post('/registerUser', registerUser);
router.post('/loginUser', loginUser);

// ===================== USER ROUTES (Protected) =====================
router.get('/getUser', authenticateToken, getUserProfile);
router.put('/editUser', authenticateToken, editUserProfile);
router.post('/uploadProfilePic', authenticateToken, upload.single('image'), updateProfilePicture);
router.delete('/deleteUser', deleteUser);

export default router;