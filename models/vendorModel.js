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

  // vendorModel.js
  findByAdminIdWithStall: async (adminId) => {
    const result = await pool.query(`
    SELECT 
      s.stall_name 
    FROM admins a
    LEFT JOIN stalls s ON a.stall_id = s.stall_id
    WHERE a.admin_id = $1
  `, [adminId]);

    return result.rows[0];
  },

  getVendorDashboardCounts: async (stallId) => {
    return await Promise.all([
      // 1. Total Sales (Sum of all completed orders for this stall)
      pool.query(
        "SELECT COALESCE(SUM(total_price), 0) AS total FROM orders WHERE stall_id = $1 AND status = 'picked_up'",
        [stallId]
      ),
      // 2. Pending Orders (Incoming or being prepared)
      pool.query(
        "SELECT COUNT(*) AS total FROM orders WHERE stall_id = $1 AND status IN ('pending', 'preparing')",
        [stallId]
      ),
      // 3. Completed Orders (Today only)
      pool.query(
        "SELECT COUNT(*) AS total FROM orders WHERE stall_id = $1 AND status = 'picked_up' AND completed_at::date = CURRENT_DATE",
        [stallId]
      ),
      // 4. Active Menu Items (Available items in their menu)
      pool.query(
        "SELECT COUNT(*) AS total FROM menu_items WHERE stall_id = $1 AND is_available = true",
        [stallId]
      )
    ]);
  },

  // Inside the Vendor object in vendorModel.js
  getTopSellingItems: async (stallId, limit = 5) => {
    const queryLimit = limit || 5;

    const result = await pool.query(`
    SELECT 
      mi.item_name, 
      SUM(od.quantity)::int as total_qty
    FROM order_details od  -- Changed from order_items to order_details
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

// Inside the Vendor object in vendorModel.js
getRecentActivity: async (stallId) => {
  const result = await pool.query(`
    (SELECT 
        o.order_id as id, 
        'New Order #' || o.order_id || ' received from ' || u.full_name as message, 
        'new_order' as type, 
        o.order_time as created_at
    FROM orders o
    -- Updated JOIN to use employee_id based on your users table
    JOIN users u ON o.user_id = u.employee_id 
    WHERE o.stall_id = $1)
    
    UNION ALL
    
    (SELECT 
        order_id as id, 
        'Order #' || order_id || ' status updated to ' || REPLACE(status, '_', ' ') as message, 
        'status_change' as type, 
        -- Using order_time as a fallback if updated_at doesn't exist yet
        order_time as created_at
    FROM orders 
    WHERE stall_id = $1 AND status != 'pending')
    
    ORDER BY created_at DESC
    LIMIT 10;
  `, [stallId]);

  return result.rows;
},

  remove: async (id) => {
    const result = await pool.query('DELETE FROM admins WHERE admin_id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

export default Vendor;