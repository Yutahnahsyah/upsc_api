import pool from '../config/db.js';
import Order from '../models/orderModel.js';
import * as menuService from './menuService.js';

export const getVendorOrders = async (stallId) => {
  return await Order.findByStall(stallId);
};

export const updateStatus = async (orderId, newStatus) => {
  const currentOrder = await Order.findById(orderId);
  if (!currentOrder) throw new Error("ORDER_NOT_FOUND");

  // Business Logic: Return Stock on Cancellation
  // Inside services/orderService.js
  if (newStatus === 'cancelled' && currentOrder.status !== 'cancelled') {
    const items = await Order.findDetails(orderId);
    await Promise.all(items.map(async (item) => {
      try {
        const menuItem = await menuService.getMenuItemById(item.item_id);
        // ADD THIS CHECK: Only update if the item still exists in the menu
        if (menuItem) {
          await menuService.updateMenuItem(item.item_id, {
            stock_qty: (menuItem.stock_qty || 0) + item.quantity
          });
        }
      } catch (e) {
        console.error(`Failed to restore stock for item ${item.item_id}:`, e);
      }
    }));
  }
  return await Order.updateStatus(orderId, newStatus);
};

export const createOrderFromCart = async (employeeId, orderData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch Cart Items (Business Logic: What is being bought?)
    const cartRes = await client.query(`
      SELECT ci.*, mi.item_name, mi.price, s.stall_name
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      JOIN menu_items mi ON ci.item_id = mi.item_id
      JOIN stalls s ON mi.stall_id = s.stall_id
      WHERE c.employee_id = $1 AND mi.stall_id = $2
    `, [employeeId, orderData.stall_id]);

    if (cartRes.rows.length === 0) throw new Error("EMPTY_CART");

    const items = cartRes.rows;
    const totalPrice = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    // 2. Delegate Persistence to Model
    const newOrder = await Order.createWithDetails(client, {
      ...orderData,
      employee_id: employeeId,
      stall_name_snapshot: items[0].stall_name,
      total_price: totalPrice
    }, items);

    // 3. Update Inventory
    for (const item of items) {
      await client.query('UPDATE menu_items SET stock_qty = stock_qty - $1 WHERE item_id = $2', [item.quantity, item.item_id]);
    }

    // 4. Clear Cart
    await client.query(`
      DELETE FROM cart_items WHERE cart_id IN (SELECT cart_id FROM carts WHERE employee_id = $1)
      AND item_id IN (SELECT item_id FROM menu_items WHERE stall_id = $2)
    `, [employeeId, orderData.stall_id]);

    await client.query('COMMIT');
    return newOrder;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getUserOrderHistory = async (employeeId) => {
  return await Order.findByUser(employeeId);
};