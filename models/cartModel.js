import pool from '../config/db.js';

const Cart = {
  // Find or Create a cart for a user
  findOrCreateCart: async (employeeId) => {
    let result = await pool.query('SELECT * FROM carts WHERE employee_id = $1', [employeeId]);

    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO carts (employee_id) VALUES ($1) RETURNING *',
        [employeeId]
      );
    }
    return result.rows[0];
  },

  // Get all items in a user's cart with menu details
  getDetails: async (cartId) => {
    const result = await pool.query(
      `SELECT ci.*, mi.item_name, mi.price, mi.item_image_url, s.stall_name
       FROM cart_items ci
       JOIN menu_items mi ON ci.item_id = mi.item_id
       JOIN stalls s ON mi.stall_id = s.stall_id
       WHERE ci.cart_id = $1`,
      [cartId]
    );
    return result.rows;
  },

  addItem: async (cartId, itemId, quantity) => {
    const result = await pool.query(
      `INSERT INTO cart_items (cart_id, item_id, quantity)
       VALUES ($1, $2, $3) RETURNING *`,
      [cartId, itemId, quantity]
    );
    return result.rows[0];
  },

  // ===================== NEW FUNCTION FOR UPSERT LOGIC =====================
  // Add this to your cartModel.js
  updateItem: async (cartItemId, quantity) => {
    // Ensure the parameter order matches the $1, $2 in the query!
    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 RETURNING *',
      [quantity, cartItemId]
    );
    return result.rows[0];
  },

  removeItem: async (cartItemId) => {
    return await pool.query('DELETE FROM cart_items WHERE cart_item_id = $1', [cartItemId]);
  },

  clearCart: async (cartId) => {
    return await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
  }
};

export default Cart;