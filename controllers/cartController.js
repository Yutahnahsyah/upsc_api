import * as cartService from '../services/cartService.js';
 import pool from '../config/db.js';

export const addItemToCart = async (req, res) => {
  try {
    const item = await cartService.addToCart(req.user.employee_id, req.body);
    res.status(201).json({ message: "Added to cart!", item });
  } catch (error) {
    // Specific business logic errors
    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({ message: "Not enough stock available." });
    }
    if (error.message === "ITEM_NOT_FOUND") {
      return res.status(404).json({ message: "Item no longer exists in the menu." });
    }
    
    if (error.message === "ITEM_UNAVAILABLE") {
      return res.status(400).json({ message: "This item is currently unavailable." });
    }
    
    console.error("Add to Cart Error:", error);
    res.status(500).json({ message: "Failed to add to cart." });
  }
};

export const getUserCart = async (req, res) => {
  try {
    const items = await cartService.viewCart(req.user.employee_id);
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Could not retrieve cart." });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    await cartService.removeFromCart(cartItemId);
    res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('removeCartItem error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
};

// This is already in your file, it just needed the service to exist!
export const clearStallCart = async (req, res) => {
  const { stallId } = req.params;
  const employeeId = req.user.employee_id; 

  try {
    await cartService.clearStall(employeeId, stallId); // This now exists
    res.status(200).json({ message: "Stall cart cleared successfully." });
  } catch (error) {
    console.error("Clear Stall Cart Error:", error);
    res.status(500).json({ message: "Failed to clear stall cart." });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    await cartService.updateItem(cartItemId, quantity);  // ✅ use cartService
    res.status(200).json({ message: 'Quantity updated' });
  } catch (error) {
    console.error('updateCartItem error:', error);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
};

export const validateCart = async (req, res) => {
  try {
    const items = await cartService.viewCart(req.user.employee_id);
    
    if (items.length === 0) {
      return res.status(200).json({ valid: true, unavailableItems: [], stallClosed: false, stallInactive: false });
    }

    // Check stall status
    const stallId = items[0].stall_id;
    const stallRes = await pool.query('SELECT is_active, is_open FROM stalls WHERE stall_id = $1', [stallId]);
    const stall = stallRes.rows[0];

    const unavailableItems = items.filter(item => !item.is_available || item.stock_qty === 0);

    res.status(200).json({
      valid: unavailableItems.length === 0 && stall?.is_open && stall?.is_active,
      unavailableItems: unavailableItems.map(i => i.item_id),
      stallClosed: stall ? !stall.is_open : false,
      stallInactive: stall ? !stall.is_active : false
    });
  } catch (error) {
    console.error('validateCart error:', error);
    res.status(500).json({ error: 'Failed to validate cart' });
  }
};