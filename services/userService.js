import User from '../models/userModel.js';
import bcrypt from 'bcrypt';

const VALID_DEPTS = ['CAHS', 'CAS', 'CCJE', 'CEA', 'CELA', 'CHTM', 'CITE', 'CMA'];

export const registerUser = async (userData) => {
  if (!VALID_DEPTS.includes(userData.department)) {
    throw { status: 400, message: 'Invalid department' };
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await User.create({ ...userData, password_hash: hashedPassword });

  const { password_hash, ...safeUser } = user;
  return safeUser;
};

export const fetchUsers = async () => await User.findAll();

export const fetchUserByEmail = async (email) => {
  return await User.findByEmail(email);
};

export const fetchProfile = async (id) => await User.findById(id);

export const editUser = async (id, updateData) => {
  const { full_name, email, department, password } = updateData;

  if (department && !VALID_DEPTS.includes(department)) {
    throw { status: 400, message: 'Invalid department type' };
  }

  let queryParts = [];
  let values = [];
  let index = 1;

  if (full_name) { queryParts.push(`full_name = $${index++}`); values.push(full_name); }
  if (email) { queryParts.push(`email = $${index++}`); values.push(email); }
  if (department) { queryParts.push(`department = $${index++}`); values.push(department); }
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    queryParts.push(`password_hash = $${index++}`);
    values.push(hashed);
  }

  if (queryParts.length === 0) throw { status: 400, message: 'No fields provided' };

  values.push(id);
  const sql = `UPDATE users SET ${queryParts.join(', ')} WHERE employee_id = $${index} RETURNING *`;

  const updated = await User.update(sql, values);
  if (!updated) throw { status: 404, message: 'User not found' };

  const { password_hash, ...safeUser } = updated;
  return safeUser;
};

export const updateAvatar = async (id, path) => await User.updateProfilePic(id, path);

export const deleteUser = async (id) => await User.remove(id);

export const toggleUserArchive = async (id, currentStatus) => {
  const newStatus = !currentStatus;
  const updatedUser = await User.updateStatus(id, newStatus);

  if (!updatedUser) throw { status: 404, message: 'User not found' };
  return updatedUser;
};

export const updateUserPassword = async (email, hashedPassword) => {
  const sql = `UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING employee_id`;
  const updated = await User.update(sql, [hashedPassword, email]);
  if (!updated) throw { status: 404, message: 'User not found' };
};

export const updateFcmToken = async (userId, fcmToken) => {
    const sql = `UPDATE users SET fcm_token = $1 WHERE employee_id = $2`;
    await User.update(sql, [fcmToken, userId]);
};

export const fetchUserById = async (id) => {
  return await User.findById(id);
};