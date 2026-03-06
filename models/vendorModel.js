import pool from '../config/db.js';

const Vendor = {
  create: async (data) => {
    const { stall_id, full_name, username, password_hash } = data;
    const result = await pool.query(
      `INSERT INTO admins (stall_id, full_name, username, password_hash, role) 
       VALUES ($1, $2, $3, $4, 'vendor_admin') RETURNING *`,
      [stall_id, full_name, username, password_hash]
    );
    return result.rows[0];
  },

  findAllWithStalls: async () => {
    const result = await pool.query(`
      SELECT a.admin_id, a.full_name, a.username, a.stall_id, s.stall_name, a.created_at
      FROM admins a
      LEFT JOIN stalls s ON a.stall_id = s.stall_id
      WHERE a.role = 'vendor_admin'
      ORDER BY a.created_at DESC
    `);
    return result.rows;
  },

  remove: async (id) => {
    const result = await pool.query('DELETE FROM admins WHERE admin_id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

export default Vendor;