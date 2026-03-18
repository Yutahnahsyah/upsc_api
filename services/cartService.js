import Cart from '../models/cartModel.js';
import Menu from '../models/menuModel.js';

export const addToCart = async (employeeId, itemData) => {
  const { item_id, quantity } = itemData;

  // 1. Check if item exists
  const item = await Menu.findById(item_id);
  if (!item) throw new Error("ITEM_NOT_FOUND");

  // --- NEW LOGIC: Check Availability Status ---
  // If the vendor toggled the item to 'Unavailable' in the UI, block the addition
  if (item.is_available === false) {
    throw new Error("ITEM_UNAVAILABLE");
  }

  // 2. Get user's cart
  const cart = await Cart.findOrCreateCart(employeeId);

  // --- NEW LOGIC: Check for existing item in cart ---
  const cartDetails = await Cart.getDetails(cart.cart_id);
  
  // Use Number() to avoid type mismatches that could lead to duplicate rows
  const existingItem = cartDetails.find(i => Number(i.item_id) === Number(item_id));

  if (existingItem) {
    const totalNewQty = Number(existingItem.quantity) + Number(quantity);
    
    // Check stock against the combined total
    if (item.stock_qty < totalNewQty) throw new Error("INSUFFICIENT_STOCK");

    // Update the existing row instead of adding a new one
    return await Cart.updateItem(existingItem.cart_item_id, totalNewQty);
  }

  // Original stock check for brand new items
  if (item.stock_qty < quantity) throw new Error("INSUFFICIENT_STOCK");

  // 3. Add to cart_items
  return await Cart.addItem(cart.cart_id, item_id, quantity);
};

export const viewCart = async (employeeId) => {
  const cart = await Cart.findOrCreateCart(employeeId);
  return await Cart.getDetails(cart.cart_id);
};