import * as vendorService from '../services/vendorService.js';

export const registerVendor = async (req, res) => {
  const { full_name, username, password, stall_id } = req.body;

  try {
    const vendor = await vendorService.registerVendor(stall_id, full_name, username, password);

    res.status(201).json({
      message: `Account for "${full_name}" registered successfully!`,
      vendor
    });
  } catch (error) {
    const errorMap = {
      "INVALID_NAME": "Full name can only contain letters and spaces.",
      "PASSWORD_LENGTH": "Password must be at least 6 characters long.",
      "PASSWORD_WHITESPACE": "Password cannot contain spaces or tabs."
    };

    if (errorMap[error.message]) {
      return res.status(400).json({ message: errorMap[error.message] });
    }

    if (error.code === '23505') {
      return res.status(400).json({ message: `Username "${username}" is already taken` });
    }

    if (error.code === '23503') {
      return res.status(404).json({ message: `Stall ID #${stall_id} does not exist` });
    }

    res.status(500).json({ message: 'Registration failed: Internal server error' });
  }
};

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await vendorService.fetchVendors();
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vendor directory' });
  }
};

export const getVendorStall = async (req, res) => {
  try {
    const adminId = req.user.admin_id || req.user.id;
    const data = await vendorService.getVendorProfile(adminId);

    if (!data) {
      return res.status(404).json({ message: "Stall not found" });
    }

    res.status(200).json({ stall_name: data.stall_name });
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteVendor = async (req, res) => {
  const { admin_id } = req.body;
  try {
    const deletedVendor = await vendorService.deleteVendor(admin_id);

    if (!deletedVendor) {
      return res.status(404).json({ message: 'Vendor account not found' });
    }

    const identifier = deletedVendor.username || `ID: ${admin_id}`;

    res.status(200).json({
      message: `Vendor "${identifier}" deleted successfully`,
      deletedVendor
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error: Could not delete vendor' });
  }
};

export const getVendorDashboard = async (req, res) => {
  const stallId = req.user.stall_id;

  if (!stallId) {
    return res.status(403).json({ 
      message: "Access Denied: You do not have an assigned stall." 
    });
  }

  try {
    const stats = await vendorService.getVendorDashboardStats(stallId);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    res.status(500).json({ message: "Failed to load dashboard statistics." });
  }
};