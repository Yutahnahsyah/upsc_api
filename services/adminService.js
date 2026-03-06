import Admin from '../models/adminModel.js';
import bcrypt from 'bcrypt';

export const registerAdmin = async (full_name, username, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await Admin.create(full_name, username, hashedPassword);

  const { password_hash, ...adminData } = admin;
  return adminData;
};

export const fetchAdminByUsername = async (username) => {
  const admin = await Admin.findByUsername(username);

  return admin;
};

export const getDashboardStats = async () => {
  const [users, vendors, active, inactive] = await Admin.getCounts();

  return {
    totalUsers: parseInt(users.rows[0].total),
    totalVendors: parseInt(vendors.rows[0].total),
    activeStalls: parseInt(active.rows[0].total),
    inactiveStalls: parseInt(inactive.rows[0].total),
  };
};