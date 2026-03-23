import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as userService from './userService.js';
import * as adminService from './adminService.js';
import { sendOtp } from '../config/mailer.js';
import { saveOtp, verifyOtp } from '../utils/otpStore.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateUser = async (email, password) => {
    const user = await userService.fetchUserByEmail(email);
    if (!user) throw { status: 400, message: 'Invalid Credentials' };

    if (!user.is_active) throw { status: 403, message: 'Your account has been archived. Please contact the administrator.' };

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw { status: 400, message: 'Invalid Credentials' };

    const token = jwt.sign({ employee_id: user.employee_id }, JWT_SECRET, { expiresIn: '8h' });

    return {
        message: 'Login Successful',
        token,
        user: {
            employee_id: user.employee_id,
            full_name: user.full_name,
            email: user.email,
            department: user.department
        }
    };
};

export const authenticateAdmin = async (username, password) => {
    const admin = await adminService.fetchAdminByUsername(username);
    if (!admin || admin.role !== 'head_admin') throw { status: 403, message: 'Access Denied: High-level privileges required.' };

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) throw { status: 400, message: 'Invalid Credentials' };

    const token = jwt.sign({ admin_id: admin.admin_id, role: admin.role }, JWT_SECRET, { expiresIn: '12h' });
    return { message: 'Login Successful', token, role: admin.role };
};

export const authenticateVendor = async (username, password) => {
    const vendor = await adminService.fetchAdminByUsername(username);
    if (!vendor) throw { status: 401, message: 'Invalid Credentials' };

    if (vendor.role !== 'vendor_admin') throw { status: 403, message: 'Access denied. Vendor portal only.' };

    if (!vendor.is_active) throw { status: 403, message: 'This account has been archived. Please contact the Head Admin for restoration.' };

    const isMatch = await bcrypt.compare(password, vendor.password_hash);
    if (!isMatch) throw { status: 401, message: 'Invalid Credentials' };

    const token = jwt.sign(
        { admin_id: vendor.admin_id, role: vendor.role, stall_id: vendor.stall_id },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
    return { message: 'Login Successful', token, stall_id: vendor.stall_id };
};

export const requestPasswordReset = async (email) => {
    const user = await userService.fetchUserByEmail(email);
    if (!user) throw { status: 404, message: 'Email not found' };
    if (!user.is_active) throw { status: 403, message: 'Account is archived. Contact the administrator.' };

    const otp = crypto.randomInt(100000, 999999).toString();
    saveOtp(email, otp);
    await sendOtp(email, otp);
};

export const verifyPasswordOtp = (email, otp) => {
    const valid = verifyOtp(email, otp);
    if (!valid) throw { status: 400, message: 'Invalid or expired OTP' };

    const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '10m' });
    return { resetToken };
};

export const resetUserPassword = async (resetToken, newPassword) => {
    let email;
    try {
        ({ email } = jwt.verify(resetToken, JWT_SECRET));
    } catch {
        throw { status: 400, message: 'Invalid or expired reset token' };
    }

    const user = await userService.fetchUserByEmail(email);
    if (!user) throw { status: 404, message: 'User not found' };

    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) throw { status: 400, message: 'New password must be different from your current password' };

    const hashed = await bcrypt.hash(newPassword, 10);
    await userService.updateUserPassword(email, hashed);
    return { message: 'Password reset successful' };
};