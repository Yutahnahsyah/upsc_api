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

// ... existing imports

export const viewCart = async (employeeId) => {
  // Use the FIXED viewCart from your model that includes the JOIN for stall_id
  return await Cart.viewCart(employeeId);
};

export const clearStall = async (employeeId, stallId) => {
  const cart = await Cart.findOrCreateCart(employeeId);
  
  // CRITICAL: Ensure stallId is a number. 
  // If the app sends "0" as a string, PG might not match it correctly in the subquery.
  const numericStallId = Number(stallId);
  
  const result = await Cart.clearCart(cart.cart_id, numericStallId);
  
  // Debugging: This will show in your server console if the query actually hit anything
  console.log(`Clearing Stall ${numericStallId} for Cart ${cart.cart_id}. Rows affected: ${result.rowCount}`);
  
  return result;
};

// Add this so the controller can actually find the function
export const removeFromCart = async (cartItemId) => {
  return await Cart.removeItem(cartItemId);
};