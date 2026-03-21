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

  // FIXED: Added stall_image_url and location to the query
  findByAdminIdWithStall: async (adminId) => {
    const result = await pool.query(`
    SELECT 
      a.admin_id,
      a.is_active, 
      s.stall_name,
      s.location,
      s.stall_image_url
    FROM admins a
    LEFT JOIN stalls s ON a.stall_id = s.stall_id
    WHERE a.admin_id = $1
  `, [adminId]);

    return result.rows[0];
  },

  getVendorDashboardCounts: async (stallId) => {
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

  getTopSellingItems: async (stallId, limit = 5) => {
    const queryLimit = limit || 5;
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
  `, [stallId, queryLimit]);
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
    JOIN users u ON o.user_id = u.employee_id 
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

  updateStatus: async (id, isActive) => {
    const result = await pool.query(
      'UPDATE admins SET is_active = $1 WHERE admin_id = $2 RETURNING *',
      [isActive, id]
    );
    return result.rows[0];
  },

  // Add this to your Vendor object in vendorModel.js
  updatePassword: async (adminId, hashedPassword) => {
    const result = await pool.query(
      'UPDATE admins SET password_hash = $1 WHERE admin_id = $2 RETURNING admin_id, username',
      [hashedPassword, adminId]
    );
    return result.rows[0];
  },

  // Add this to the Vendor object in vendorModel.js
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