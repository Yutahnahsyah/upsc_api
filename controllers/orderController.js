import * as orderService from '../services/orderService.js';

// ===================== VENDOR SIDE =====================

/**
 * Fetches all orders for the vendor's assigned stall.
 * Triggered by the Vendor Dashboard on load.
 */
export const getStallOrders = async (req, res) => {
  const stallId = req.user.stall_id;

  if (!stallId) {
    return res.status(403).json({ message: "Unauthorized: No stall assigned to this account." });
  }

  try {
    const orders = await orderService.getVendorOrders(stallId);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    res.status(500).json({ message: "Failed to load orders." });
  }
};

/**
 * Updates order status (e.g., pending -> preparing -> ready).
 * Handles success messages for frontend toast notifications.
 */
export const updateOrderStatus = async (req, res) => {
  // Destructure with the naming used in your React component
  const { orderId, status } = req.body;

  // Log it to your terminal to verify what is arriving
  console.log("Update Request Received:", { orderId, status });

  if (!orderId || !status) {
    return res.status(400).json({
      message: "Order ID and status are required.",
      received: { orderId, status }
    });
  }

  try {
    // Inside controllers/orderController.js
    const updated = await orderService.updateStatus(Number(orderId), status);
    if (!updated) return res.status(404).json({ message: "Order not found." });

    res.status(200).json({
      message: "Status updated successfully!",
      order: updated
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Internal server error during update." });
  }
};

// ===================== USER SIDE =====================

/**
 * Converts the current cart items into a formal order.
 * Snapshots prices/names to protect against future menu changes.
 */
export const placeOrder = async (req, res) => {
  const { employee_id } = req.user;
  const { stall_id, payment_type, order_remarks } = req.body;

  if (!stall_id || !payment_type) {
    return res.status(400).json({ message: "Missing stall selection or payment method." });
  }

  try {
    const newOrder = await orderService.createOrderFromCart(employee_id, {
      stall_id,
      payment_type,
      order_remarks
    });

    res.status(201).json({
      message: "Order placed successfully! Wait for vendor confirmation.",
      order: newOrder
    });
  } catch (error) {
    console.error("Place Order Error:", error);

    if (error.message === "EMPTY_CART") {
      return res.status(400).json({ message: "Your cart is empty for this stall." });
    }

    res.status(500).json({ message: "Failed to place order." });
  }
};

/**
 * Fetches the specific user's order history.
 */
export const getUserOrders = async (req, res) => {
  const { employee_id } = req.user;

  try {
    const orders = await orderService.getUserOrderHistory(employee_id);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve your order history." });
  }
};