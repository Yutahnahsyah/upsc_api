import pool from '../config/db.js';

const Order = {
  findByStall: async (stallId) => {
    const result = await pool.query(`
    SELECT o.*, 
           u.full_name, u.department,
      json_agg(json_build_object(
        'item_name_snapshot', od.item_name_snapshot,
        'quantity', od.quantity,
        'price_at_order', od.price_at_order
      )) AS items
    FROM orders o
    LEFT JOIN users u ON o.employee_id = u.employee_id
    LEFT JOIN order_details od ON o.order_id = od.order_id
    WHERE o.stall_id = $1
    GROUP BY o.order_id, u.full_name, u.department, o.order_time
    ORDER BY o.order_time DESC
  `, [stallId]);
    return result.rows;
  },

  findById: async (orderId) => {
    const result = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
    return result.rows[0];
  },

  findDetails: async (orderId) => {
    const result = await pool.query('SELECT * FROM order_details WHERE order_id = $1', [orderId]);
    return result.rows;
  },

  createWithDetails: async (client, orderData, items) => {
    const { employee_id, stall_id, stall_name_snapshot, total_price, payment_type, order_remarks } = orderData;

    const orderRes = await client.query(`
      INSERT INTO orders (employee_id, stall_id, stall_name_snapshot, total_price, payment_type, order_remarks)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [employee_id, stall_id, stall_name_snapshot, total_price, payment_type, order_remarks]);

    const newOrder = orderRes.rows[0];

    for (const item of items) {
      await client.query(`
        INSERT INTO order_details (order_id, item_id, item_name_snapshot, quantity, price_at_order)
        VALUES ($1, $2, $3, $4, $5)
      `, [newOrder.order_id, item.item_id, item.item_name, item.quantity, item.price]);
    }
    return newOrder;
  },

  updateStatus: async (orderId, status) => {
    const result = await pool.query(`
    UPDATE orders 
    SET status = $1::order_status,
        is_paid = CASE WHEN $1::order_status = 'picked_up' THEN TRUE ELSE is_paid END,
        completed_at = CASE WHEN $1::order_status = 'picked_up' THEN CURRENT_TIMESTAMP ELSE completed_at END,
        cancelled_at = CASE WHEN $1::order_status = 'cancelled' THEN CURRENT_TIMESTAMP ELSE cancelled_at END,
        pickup_time = CASE WHEN $1::order_status = 'ready' THEN CURRENT_TIMESTAMP ELSE pickup_time END
    WHERE order_id = $2 
    RETURNING *
  `, [status, orderId]);
    return result.rows[0];
  },

  findByUser: async (employeeId) => {
    const result = await pool.query(`
      SELECT o.*, 
      json_agg(json_build_object(
        'item_name', od.item_name_snapshot,
        'quantity', od.quantity,
        'price', od.price_at_order
      )) AS items
      FROM orders o
      LEFT JOIN order_details od ON o.order_id = od.order_id
      WHERE o.employee_id = $1
      GROUP BY o.order_id, o.order_time
      ORDER BY o.order_time DESC
    `, [employeeId]);
    return result.rows;
  }
};

export default Order;