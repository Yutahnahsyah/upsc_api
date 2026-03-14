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
  // If you are using a custom SQL model:
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