import pool from '../config/db.js';

const Cart = {
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
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, item_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *`,
      [cartId, itemId, quantity]
    );
    return result.rows[0];
  },

  updateItem: async (cartItemId, quantity) => {
    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 RETURNING *',
      [quantity, cartItemId]
    );
    return result.rows[0];
  },

  removeItem: async (cartItemId) => {
    return await pool.query('DELETE FROM cart_items WHERE cart_item_id = $1', [cartItemId]);
  },

  clearCart: async (cartId, stallId = null) => {
    if (stallId !== null && stallId !== undefined) {
      const query = `
        DELETE FROM cart_items 
        WHERE cart_id = $1 
        AND item_id IN (
          SELECT item_id 
          FROM menu_items 
          WHERE stall_id = $2
        )
      `;
      return await pool.query(query, [cartId, stallId]);
    } else {
      return await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    }
  },

  viewCart: async (employeeId) => {
    const cart = await Cart.findOrCreateCart(employeeId);

    const query = `
    SELECT 
      ci.*, 
      mi.item_name, 
      mi.price, 
      mi.item_image_url, 
      mi.stall_id,
      mi.stock_qty,
      mi.is_available,
      s.stall_name
    FROM cart_items ci
    JOIN menu_items mi ON ci.item_id = mi.item_id
    JOIN stalls s ON mi.stall_id = s.stall_id
    WHERE ci.cart_id = $1
  `;

    const result = await pool.query(query, [cart.cart_id]);
    return result.rows;
  }
};

export default Cart;