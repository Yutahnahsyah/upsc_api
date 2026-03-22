import Vendor from '../models/vendorModel.js';
import bcrypt from 'bcrypt';

export const registerVendor = async (stall_id, full_name, username, password) => {
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!full_name || !nameRegex.test(full_name)) {
    throw new Error("INVALID_NAME");
  }

  const hasWhitespace = /\s/.test(password);
  if (!password || password.length < 6) {
    throw new Error("PASSWORD_LENGTH");
  }

  if (hasWhitespace) {
    throw new Error("PASSWORD_WHITESPACE");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const vendor = await Vendor.create({
    stall_id,
    full_name,
    username,
    password_hash: hashedPassword
  });

  const { password_hash, ...vendorData } = vendor;
  return vendorData;
};

export const getVendorProfile = async (adminId) => {
  const vendor = await Vendor.findByAdminIdWithStall(adminId);
  if (!vendor) {
    throw new Error("VENDOR_NOT_FOUND");
  }
  return vendor;
};

export const fetchVendors = async () => {
  return await Vendor.findAllWithStalls();
};

export const archiveVendor = async (admin_id) => {
  // We set is_active to false to "Archive"
  return await Vendor.updateStatus(admin_id, false);
};

export const reactivateVendor = async (admin_id) => {
  return await Vendor.updateStatus(admin_id, true);
};

export const resetVendorPassword = async (adminId, newPassword) => {
  // Reuse your validation logic
  const hasWhitespace = /\s/.test(newPassword);
  if (!newPassword || newPassword.length < 6) {
    throw new Error("PASSWORD_LENGTH");
  }
  if (hasWhitespace) {
    throw new Error("PASSWORD_WHITESPACE");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  return await Vendor.updatePassword(adminId, hashedPassword);
};

export const updateVendor = async (adminId, updateData) => {
  const { full_name, username, stall_id } = updateData;

  // 1. Validate Name (same regex as registration)
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!full_name || !nameRegex.test(full_name)) {
    throw new Error("INVALID_NAME");
  }

  // 2. Perform Update
  const updatedVendor = await Vendor.update(adminId, {
    full_name,
    username,
    stall_id
  });

  if (!updatedVendor) {
    throw new Error("VENDOR_NOT_FOUND");
  }

  return updatedVendor;
};

export const deleteVendor = async (adminId) => {
  const deleted = await Vendor.remove(adminId);
  if (!deleted) throw new Error('VENDOR_NOT_FOUND');
  return deleted;
};