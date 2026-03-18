import pool from '../config/db.js';
import Order from '../models/orderModel.js';
import * as menuService from './menuService.js';

export const getVendorOrders = async (stallId) => {
  return await Order.findByStall(stallId);
};

export const updateStatus = async (orderId, newStatus) => {
  const currentOrder = await Order.findById(orderId);
  if (!currentOrder) throw new Error("ORDER_NOT_FOUND");

  if (newStatus === 'preparing' && currentOrder.status === 'pending') {
    const items = await Order.findDetails(orderId);

    const aggregatedItems = items.reduce((acc, item) => {
      acc[item.item_id] = {
        name: item.item_name_snapshot,
        quantity: (acc[item.item_id]?.quantity || 0) + item.quantity
      };
      return acc;
    }, {});

    const outOfStockDetails = []; // Changed from outOfStockItems

    // Check all items before deducting anything
    await Promise.all(
      Object.entries(aggregatedItems).map(async ([itemId, data]) => {
        const menuItem = await menuService.getMenuItemById(Number(itemId));
        const currentStock = menuItem ? menuItem.stock_qty : 0;

        if (currentStock < data.quantity) {
          const missingCount = data.quantity - currentStock;
          // Format: "Item Name (Need X more)"
          outOfStockDetails.push(`${data.name} (Need ${missingCount} more)`);
        }
      })
    );

    // If any items are missing, throw with the specific details
    if (outOfStockDetails.length > 0) {
      const err = new Error("INSUFFICIENT_STOCK");
      err.details = outOfStockDetails; // This now contains the "Need X more" strings
      throw err;
    }

    // If all clear, deduct the stock
    await Promise.all(
      Object.entries(aggregatedItems).map(async ([itemId, data]) => {
        await menuService.decrementStock(Number(itemId), data.quantity);
      })
    );
  }

  // Stock restoration logic (unchanged)
  if (newStatus === 'cancelled' && currentOrder.status !== 'cancelled') {
    if (['preparing', 'ready'].includes(currentOrder.status)) {
      const items = await Order.findDetails(orderId);
      await Promise.all(items.map(async (item) => {
        try {
          const menuItem = await menuService.getMenuItemById(item.item_id);
          if (menuItem) {
            await menuService.updateMenuItem(item.item_id, {
              stock_qty: (menuItem.stock_qty || 0) + item.quantity
            });
          }
        } catch (e) { console.error(e); }
      }));
    }
  }

  return await Order.updateStatus(orderId, newStatus);
};

export const createOrderFromCart = async (employeeId, orderData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch Cart Items
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

    // 3. REMOVED: Stock deduction logic (Now handled in updateStatus)

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