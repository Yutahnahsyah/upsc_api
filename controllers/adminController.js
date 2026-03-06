import * as adminService from '../services/adminService.js';

export const registerAdmin = async (req, res) => {
  const { full_name, username, password } = req.body;
  try {
    // Controller just calls the Service
    const adminData = await adminService.registerAdmin(full_name, username, password);

    res.status(201).json({
      message: 'Admin Registered Successfully',
      admin: adminData
    });
  } catch (error) {
    // Controller handles the HTTP specific error codes
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getAdminDashboard = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve stats' });
  }
};