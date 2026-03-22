import * as orderService from '../services/orderService.js';
import * as userService from '../services/userService.js';
import { sendPushNotification } from '../config/firebase.js';

export const placeOrder = async (req, res) => {
  const { employee_id, full_name } = req.user;
  let { stall_id, payment_type, order_remarks } = req.body;

  if (!stall_id || !payment_type) {
    return res.status(400).json({ message: "Missing stall selection or payment method." });
  }

  try {
    const normalizedPaymentType = payment_type.toLowerCase();

    const newOrder = await orderService.createOrderFromCart(employee_id, {
      stall_id,
      payment_type: normalizedPaymentType,
      order_remarks
    });

    const io = req.app.get('socketio');
    if (io) {
      const roomName = `stall_${stall_id}`;
      io.to(roomName).emit('new_order_alert', {
        message: "You have a new incoming order!",
        orderId: newOrder.order_id,
        customerName: full_name || "Customer",
        totalAmount: newOrder.total_price,
        orderDate: newOrder.order_time
      });
    }

    res.status(201).json({
      message: "Order placed successfully!",
      order: newOrder
    });
  } catch (error) {
    console.error("Place Order Error:", error);
    res.status(500).json({ message: "Failed to place order.", error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  const { employee_id } = req.user;
  try {
    const orders = await orderService.getUserOrderHistory(employee_id);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve history." });
  }
};

export const getStallOrders = async (req, res) => {
  const stallId = req.user.stall_id;
  if (!stallId) return res.status(403).json({ message: "Unauthorized: No stall assigned." });
  try {
    const orders = await orderService.getVendorOrders(stallId);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to load orders." });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { orderId, order_id, status } = req.body;
  const resolvedOrderId = order_id ?? orderId;

  console.log('updateOrderStatus called:', { resolvedOrderId, status });

  try {
    const updatedOrder = await orderService.updateStatus(resolvedOrderId, status);

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status === 'ready' && updatedOrder.employee_id) {
      const user = await userService.fetchUserById(updatedOrder.employee_id);
      console.log('User FCM token:', user?.fcm_token);
      if (user?.fcm_token) {
        await sendPushNotification(
          user.fcm_token,
          '🍽️ Order Ready!',
          `Your order from ${updatedOrder.stall_name_snapshot} is ready for pickup!`
        );
      }
    }

    const io = req.app.get('socketio');
    if (io) {
      io.to(`stall_${updatedOrder.stall_id}`).emit('order_status_updated', updatedOrder);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('updateOrderStatus error:', error.message);

    if (error.message === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({ message: 'Not enough stock to prepare this order' });
    }
    if (error.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (error.message === 'ITEM_NOT_FOUND') {
      return res.status(404).json({ message: 'A menu item in this order no longer exists' });
    }

    res.status(error.status || 500).json({ message: error.message });
  }
};
