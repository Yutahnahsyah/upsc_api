import pool from '../config/db.js';
import Order from '../models/orderModel.js';
import * as menuService from './menuService.js';

export const getVendorOrders = async (stallId) => {
  return await Order.findByStall(stallId);
};

export const createOrderFromCart = async (employeeId, orderData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
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

    const newOrder = await Order.createWithDetails(client, {
      ...orderData,
      employee_id: employeeId,
      stall_name_snapshot: items[0].stall_name,
      total_price: totalPrice
    }, items);

    await client.query(`
      DELETE FROM cart_items WHERE cart_id IN (SELECT cart_id FROM carts WHERE employee_id = $1)
      AND item_id IN (SELECT item_id FROM menu_items WHERE stall_id = $2)
    `, [employeeId, orderData.stall_id]);

    await client.query('COMMIT');
    return { ...newOrder, total_price: totalPrice };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateStatus = async (orderId, newStatus) => {
  const currentOrder = await Order.findById(orderId);
  if (!currentOrder) throw new Error("ORDER_NOT_FOUND");

  if (newStatus === 'preparing' && currentOrder.status === 'pending') {
    const items = await Order.findDetails(orderId);
    for (const item of items) {
      await menuService.decrementStock(item.item_id, item.quantity);
    }
  }

  if (newStatus === 'cancelled' && ['preparing', 'ready'].includes(currentOrder.status)) {
    const items = await Order.findDetails(orderId);
    for (const item of items) {
      const menuItem = await menuService.getMenuItemById(item.item_id);
      if (menuItem) {
        await menuService.updateMenuItem(item.item_id, { stock_qty: menuItem.stock_qty + item.quantity });
      }
    }
  }

  return await Order.updateStatus(orderId, newStatus);
};

export const getUserOrderHistory = async (employeeId) => {
  return await Order.findByUser(employeeId);
};