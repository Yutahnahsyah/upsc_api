import pool from '../config/db.js';

const Stall = {
  create: async (name, location) => {
    const result = await pool.query(
      'INSERT INTO stalls (stall_name, location) VALUES ($1, $2) RETURNING *',
      [name, location]
    );
    return result.rows[0];
  },

  findByName: async (name) => {
    const result = await pool.query(
      'SELECT * FROM stalls WHERE stall_name = $1 LIMIT 1',
      [name]
    );
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await pool.query(
      'SELECT stall_id, stall_name, location, stall_image_url, is_active FROM stalls WHERE stall_id = $1',
      [id]
    );
    return result.rows[0];
  },

  findAll: async () => {
    const result = await pool.query(
      // FIXED: Added stall_image_url to the selection
      'SELECT stall_id, stall_name, location, stall_image_url, is_active FROM stalls ORDER BY stall_id DESC'
    );
    return result.rows;
  },

  findActive: async () => {
    const result = await pool.query(
      // FIXED: Added is_active to the selection to match the Android Model
      'SELECT stall_id, stall_name, location, stall_image_url, is_active FROM stalls WHERE is_active = true ORDER BY stall_name ASC'
    );
    return result.rows;
  },

  updateStatus: async (id, is_active) => {
    const result = await pool.query(
      "UPDATE stalls SET is_active = $1 WHERE stall_id = $2 RETURNING *",
      [is_active, id]
    );
    return result.rows[0];
  },

  getVendorCount: async (id) => {
    const result = await pool.query('SELECT COUNT(*) FROM admins WHERE stall_id = $1', [id]);
    return parseInt(result.rows[0].count);
  },

  update: async (id, updates) => {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    if (keys.length === 0) return null;

    const setClause = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');

    const result = await pool.query(
      `UPDATE stalls SET ${setClause} WHERE stall_id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  },

  remove: async (id) => {
    const result = await pool.query('DELETE FROM stalls WHERE stall_id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

export default Stall;