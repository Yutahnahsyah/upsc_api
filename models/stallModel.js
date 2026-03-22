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
      'SELECT stall_id, stall_name, location, stall_image_url, is_active, is_open FROM stalls WHERE stall_id = $1',
      [id]
    );
    return result.rows[0];
  },

  findAll: async () => {
    const result = await pool.query(
      'SELECT stall_id, stall_name, location, stall_image_url, is_active, is_open FROM stalls ORDER BY stall_id DESC'
    );
    return result.rows;
  },

  findActive: async () => {
    const result = await pool.query(
      'SELECT stall_id, stall_name, location, stall_image_url, is_active, is_open FROM stalls WHERE is_active = true ORDER BY stall_name ASC'
    );
    return result.rows;
  },
  
  updateActiveStatus: async (id, is_active) => {
    const result = await pool.query(
      "UPDATE stalls SET is_active = $1 WHERE stall_id = $2 RETURNING *",
      [is_active, id]
    );
    return result.rows[0];
  },

  updateOpenStatus: async (id, is_open) => {
    const result = await pool.query(
      "UPDATE stalls SET is_open = $1 WHERE stall_id = $2 RETURNING *",
      [is_open, id]
    );
    return result.rows[0];
  },

  getVendorCount: async (id) => {
    const result = await pool.query('SELECT COUNT(*) FROM admins WHERE stall_id = $1', [id]);
    return parseInt(result.rows[0].count);
  },

  getDashboardCounts: async (stallId) => {
    return await Promise.all([
      pool.query(
        "SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE stall_id = $1 AND status = 'picked_up' AND completed_at::date = CURRENT_DATE",
        [stallId]
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM orders WHERE stall_id = $1 AND status IN ('pending', 'preparing')",
        [stallId]
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM orders WHERE stall_id = $1 AND status = 'picked_up' AND completed_at::date = CURRENT_DATE",
        [stallId]
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM menu_items WHERE stall_id = $1 AND is_available = true",
        [stallId]
      )
    ]);
  },

  getOverallStats: async (stallId) => {
    return await Promise.all([
      pool.query(
        "SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE stall_id = $1 AND status = 'picked_up'",
        [stallId]
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM orders WHERE stall_id = $1 AND status = 'picked_up'",
        [stallId]
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM orders WHERE stall_id = $1 AND status = 'cancelled'",
        [stallId]
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM orders WHERE stall_id = $1",
        [stallId]
      )
    ]);
  },

  getTopSellingItems: async (stallId, limit = 5) => {
    const result = await pool.query(`
      SELECT 
        mi.item_name, 
        SUM(od.quantity)::int as total_qty
      FROM order_details od
      JOIN orders o ON od.order_id = o.order_id
      JOIN menu_items mi ON od.item_id = mi.item_id
      WHERE o.stall_id = $1 
        AND o.status = 'picked_up'
      GROUP BY mi.item_name
      ORDER BY total_qty DESC
      LIMIT $2
    `, [stallId, limit || 5]);
    return result.rows;
  },

  getRecentActivity: async (stallId) => {
    const result = await pool.query(`
      (SELECT 
          o.order_id as id, 
          'New Order #' || o.order_id || ' received from ' || u.full_name as message, 
          'new_order' as type, 
          o.order_time as created_at
      FROM orders o
      JOIN users u ON o.employee_id = u.employee_id 
      WHERE o.stall_id = $1)
      
      UNION ALL
      
      (SELECT 
          order_id as id, 
          'Order #' || order_id || ' status updated to ' || REPLACE(status::TEXT, '_', ' ') as message, 
          'status_change' as type, 
          order_time as created_at
      FROM orders 
      WHERE stall_id = $1 AND status != 'pending')
      
      ORDER BY created_at DESC
      LIMIT 10;
    `, [stallId]);
    return result.rows;
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