import pool from '../config/db.js';

const Admin = {
  create: async (full_name, username, password_hash) => {
    const result = await pool.query(
      `INSERT INTO admins (full_name, username, password_hash, role) 
       VALUES ($1, $2, $3, 'head_admin') RETURNING *`,
      [full_name, username, password_hash]
    );
    return result.rows[0];
  },

  findByUsername: async (username) => {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    return result.rows[0];
  },

  // Runs the parallel queries and returns the raw counts
  getCounts: async () => {
    return await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM users'),
      pool.query("SELECT COUNT(*) AS total FROM admins WHERE role = 'vendor_admin'"),
      pool.query('SELECT COUNT(*) AS total FROM stalls WHERE is_active = true'),
      pool.query('SELECT COUNT(*) AS total FROM stalls WHERE is_active = false')
    ]);
  }
};

export default Admin;