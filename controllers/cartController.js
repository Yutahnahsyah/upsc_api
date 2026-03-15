import * as cartService from '../services/cartService.js';

export const addItemToCart = async (req, res) => {
  try {
    const item = await cartService.addToCart(req.user.employee_id, req.body);
    res.status(201).json({ message: "Added to cart!", item });
  } catch (error) {
    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({ message: "Not enough stock available." });
    }
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

// ADD THIS to match the router.delete('/removeFromCart/:cartItemId', ...)
export const removeItem = async (req, res) => {
  const { cartItemId } = req.params;
  try {
    await cartService.removeFromCart(cartItemId);
    res.status(200).json({ message: "Item removed from cart." });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove item." });
  }
};