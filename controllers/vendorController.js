import * as vendorService from '../services/vendorService.js';

export const registerVendor = async (req, res) => {
  const { full_name, username, password, stall_id } = req.body;

  try {
    const vendor = await vendorService.registerVendor(stall_id, full_name, username, password);

    res.status(201).json({
      message: `Account for "${full_name}" registered successfully`,
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
    // Note: Using req.user.id or admin_id depending on your auth middleware payload
    const adminId = req.user.admin_id || req.user.id;
    const data = await vendorService.getVendorProfile(adminId);

    if (!data) {
      return res.status(404).json({ message: "Stall not found" });
    }

    // FIX: Return the entire data object (includes stall_name, location, stall_image_url)
    res.status(200).json(data);

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const archiveVendor = async (req, res) => {
  const { admin_id } = req.body;
  try {
    // 1. First, get the current vendor profile to check their status
    const vendor = await vendorService.getVendorProfile(admin_id);

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor account not found' });
    }

    // 2. Decide action based on current is_active status
    let updatedVendor;
    if (vendor.is_active) {
      updatedVendor = await vendorService.archiveVendor(admin_id);
    } else {
      updatedVendor = await vendorService.reactivateVendor(admin_id);
    }

    const identifier = updatedVendor.username || `ID: ${admin_id}`;
    const statusText = updatedVendor.is_active ? 'restored' : 'archived';

    res.status(200).json({
      message: `Vendor "${identifier}" has been ${statusText}`,
      vendor: updatedVendor
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    res.status(500).json({ message: 'Internal Server Error: Could not update vendor status' });
  }
};

export const changeVendorPassword = async (req, res) => {
  const { admin_id, new_password } = req.body;

  try {
    const updated = await vendorService.resetVendorPassword(admin_id, new_password);
    res.status(200).json({
      message: `Password for @${updated.username} updated successfully`
    });
  } catch (error) {
    const errorMap = {
      "PASSWORD_LENGTH": "Password must be at least 6 characters long",
      "PASSWORD_WHITESPACE": "Password cannot contain spaces"
    };

    if (errorMap[error.message]) {
      return res.status(400).json({ message: errorMap[error.message] });
    }
    res.status(500).json({ message: "Failed to reset password" });
  }
};

export const updateVendor = async (req, res) => {
  const { admin_id } = req.params;
  const { full_name, username, stall_id, new_password } = req.body;

  try {
    // 1. Update the basic profile information
    const updated = await vendorService.updateVendor(admin_id, {
      full_name,
      username,
      stall_id,
    });

    // 2. If a new password was provided, update it as well
    if (new_password && new_password.trim() !== "") {
      await vendorService.resetVendorPassword(admin_id, new_password);
    }

    res.status(200).json({
      message: `Vendor "${updated.full_name}" updated successfully`,
      vendor: updated,
    });
  } catch (error) {
    // Handle specific validation errors from service layer
    const errorMap = {
      "INVALID_NAME": "Full name can only contain letters.",
      "PASSWORD_LENGTH": "New password must be at least 6 characters.",
      "PASSWORD_WHITESPACE": "Password cannot contain spaces."
    };

    if (errorMap[error.message]) {
      return res.status(400).json({ message: errorMap[error.message] });
    }

    if (error.code === '23505') {
      return res.status(400).json({ message: `Username "${username}" is already taken` });
    }

    console.error("Update Vendor Error:", error);
    res.status(500).json({ message: "Failed to update vendor information" });
  }
};

export const deleteVendor = async (req, res) => {
  const { admin_id } = req.body;
  try {
    const deleted = await vendorService.deleteVendor(admin_id);
    res.status(200).json({
      message: `Vendor "${deleted.full_name}" deleted successfully`,
      vendor: deleted
    });
  } catch (error) {
    if (error.message === 'VENDOR_NOT_FOUND') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.status(500).json({ message: 'Failed to delete vendor' });
  }
};