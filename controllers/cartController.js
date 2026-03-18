import * as cartService from '../services/cartService.js';

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
    
    // --- ADDED THIS TO MATCH YOUR NEW SERVICE LOGIC ---
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

export const removeItem = async (req, res) => {
  const { cartItemId } = req.params;
  try {
    // Ensure the service name matches your actual service function name
    await cartService.removeFromCart(cartItemId);
    res.status(200).json({ message: "Item removed from cart." });
  } catch (error) {
    console.error("Remove Item Error:", error);
    res.status(500).json({ message: "Failed to remove item." });
  }
};