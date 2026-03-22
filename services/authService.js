import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userService from './userService.js';
import * as adminService from './adminService.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateUser = async (email, password) => {
  const user = await userService.fetchUserByEmail(email);
  if (!user) throw { status: 400, message: 'Invalid Credentials' };

  if (!user.is_active) throw { status: 403, message: 'Your account has been archived. Please contact the administrator.' };

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw { status: 400, message: 'Invalid Credentials' };

  const token = jwt.sign({ employee_id: user.employee_id }, JWT_SECRET, { expiresIn: '8h' });
  return { message: 'Login Successful', token };
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