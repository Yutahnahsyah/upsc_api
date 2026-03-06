import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userService from '../services/userService.js';
import * as adminService from '../services/adminService.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userService.fetchUserByEmail(email);
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const token = jwt.sign({ employee_id: user.employee_id }, JWT_SECRET);
    res.json({ message: "Login Successful", token });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await adminService.fetchAdminByUsername(username);
    if (!admin || admin.role !== 'head_admin') {
      return res.status(403).json({ message: 'Access Denied: High-level privileges required.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const token = jwt.sign({ admin_id: admin.admin_id, role: admin.role }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ message: "Login Successful", token, role: admin.role });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const loginVendor = async (req, res) => {
  const { username, password } = req.body;
  try {
    const vendor = await adminService.fetchAdminByUsername(username);
    if (!vendor || vendor.role !== 'vendor_admin') {
      return res.status(403).json({ message: 'Access denied. Vendor portal only.' });
    }

    const isMatch = await bcrypt.compare(password, vendor.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const token = jwt.sign(
      { admin_id: vendor.admin_id, role: vendor.role, stall_id: vendor.stall_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ message: "Login Successful", token, stall_id: vendor.stall_id });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};