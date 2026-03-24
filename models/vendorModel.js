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
      SELECT a.admin_id, a.full_name, a.username, a.stall_id, s.stall_name, a.created_at, a.is_active
      FROM admins a
      LEFT JOIN stalls s ON a.stall_id = s.stall_id
      WHERE a.role = 'vendor_admin'
      ORDER BY a.created_at DESC
    `);
    return result.rows;
  },

  findByAdminIdWithStall: async (adminId) => {
    const result = await pool.query(`
    SELECT 
      a.admin_id,
      a.full_name,
      a.is_active, 
      s.stall_name,
      s.location,
      s.stall_image_url,
      s.is_open
    FROM admins a
    LEFT JOIN stalls s ON a.stall_id = s.stall_id
    WHERE a.admin_id = $1
  `, [adminId]);

    return result.rows[0];
  },

  updateStatus: async (id, isActive) => {
    const result = await pool.query(
      'UPDATE admins SET is_active = $1 WHERE admin_id = $2 RETURNING *',
      [isActive, id]
    );
    return result.rows[0];
  },

  updatePassword: async (adminId, hashedPassword) => {
    const result = await pool.query(
      'UPDATE admins SET password_hash = $1 WHERE admin_id = $2 RETURNING admin_id, username',
      [hashedPassword, adminId]
    );
    return result.rows[0];
  },

  update: async (adminId, data) => {
    const { full_name, username, stall_id } = data;
    const result = await pool.query(
      `UPDATE admins 
       SET full_name = $1, username = $2, stall_id = $3 
       WHERE admin_id = $4 
       RETURNING admin_id, full_name, username, stall_id, is_active`,
      [full_name, username, stall_id, adminId]
    );
    return result.rows[0];
  },

  remove: async (id) => {
    const result = await pool.query('DELETE FROM admins WHERE admin_id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

export default Vendor;