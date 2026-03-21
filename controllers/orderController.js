import * as orderService from '../services/orderService.js';

/**
 * Main function to place an order. 
 * Converts payment_type to lowercase to match DB ENUM.
 */
export const placeOrder = async (req, res) => {
  const { employee_id, full_name } = req.user;
  let { stall_id, payment_type, order_remarks } = req.body;

  if (!stall_id || !payment_type) {
    return res.status(400).json({ message: "Missing stall selection or payment method." });
  }

  try {
    // FIX: Normalize payment_type for strict DB Enums
    const normalizedPaymentType = payment_type.toLowerCase();

    const newOrder = await orderService.createOrderFromCart(employee_id, {
      stall_id,
      payment_type: normalizedPaymentType,
      order_remarks
    });

    // --- SOCKET.IO NOTIFICATION ---
    const io = req.app.get('socketio');
    if (io) {
      // Room must match server.js logic: `stall_${stallId}`
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
  const { orderId, status } = req.body;
  try {
    const updated = await orderService.updateStatus(Number(orderId), status);
    res.status(200).json({ message: `Order updated to ${status}`, order: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};