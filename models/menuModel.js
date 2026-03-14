import pool from '../config/db.js';

const Menu = {
  // Create: Added default for is_available and handled optional description/stock
  create: async (itemData) => {
    const {
      stall_id,
      item_name,
      description = '',
      category,
      price,
      stock_qty = 0,
      item_image_url = null
    } = itemData;

    const result = await pool.query(
      `INSERT INTO menu_items 
       (stall_id, item_name, description, category, price, stock_qty, item_image_url, is_available) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [stall_id, item_name, description, category, price, stock_qty, item_image_url, true] // Default to true
    );
    return result.rows[0];
  },

  findByStall: async (stallId) => {
    const result = await pool.query(
      'SELECT * FROM menu_items WHERE stall_id = $1 ORDER BY item_id DESC',
      [stallId]
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query(
      'SELECT * FROM menu_items WHERE item_id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Dynamic Update: This is already great! 
  // It handles handleUpdate(id, { is_available: false }) perfectly.
  update: async (id, updates) => {
    const keys = Object.keys(updates);
    const values = Object.values(updates);

    if (keys.length === 0) return null;

    const setClause = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');

    const result = await pool.query(
      `UPDATE menu_items SET ${setClause} WHERE item_id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  },

  remove: async (id) => {
    // Use item_id to match your table schema
    const result = await pool.query(
      'DELETE FROM menu_items WHERE item_id = $1 RETURNING *',
      [parseInt(id, 10)] // Explicitly cast to integer for safety
    );
    return result.rows[0]; // Returns the deleted item or undefined
  }
};

export default Menu;