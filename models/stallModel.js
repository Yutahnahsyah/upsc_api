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

  findAll: async () => {
    const result = await pool.query(
      'SELECT stall_id, stall_name, location, is_active FROM stalls ORDER BY stall_id DESC'
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

  remove: async (id) => {
    const result = await pool.query('DELETE FROM stalls WHERE stall_id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

export default Stall;