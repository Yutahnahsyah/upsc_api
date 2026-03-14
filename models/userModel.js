import pool from '../config/db.js';

const User = {
  create: async (data) => {
    const { employee_id, full_name, email, password_hash, department } = data;
    const result = await pool.query(
      'INSERT INTO users (employee_id, full_name, email, password_hash, department) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [employee_id, full_name, email, password_hash, department]
    );
    return result.rows[0];
  },
  
  findById: async (id) => {
    const result = await pool.query(
      'SELECT employee_id, full_name, email, department, profile_picture_url FROM users WHERE employee_id = $1',
      [id]
    );
    return result.rows[0];
  },

  findByEmail: async (email) => {
    const result = await pool.query(
      'SELECT employee_id, full_name, email, password_hash, department FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },
  
  findAll: async () => {
    const result = await pool.query(
      'SELECT employee_id, full_name, email, department, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  },

  update: async (sql, values) => {
    const result = await pool.query(sql, values);
    return result.rows[0];
  },

  updateProfilePic: async (id, imageUrl) => {
    const result = await pool.query(
      'UPDATE users SET profile_picture_url = $1 WHERE employee_id = $2 RETURNING employee_id, full_name, profile_picture_url',
      [imageUrl, id]
    );
    return result.rows[0];
  },

  remove: async (id) => {
    const result = await pool.query('DELETE FROM users WHERE employee_id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

export default User;