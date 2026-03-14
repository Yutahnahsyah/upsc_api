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

export const fetchVendors = async () => {
  return await Vendor.findAllWithStalls();
};

export const deleteVendor = async (admin_id) => {
  return await Vendor.remove(admin_id);
};