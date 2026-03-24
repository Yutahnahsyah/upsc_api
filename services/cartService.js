import Cart from '../models/cartModel.js';
import Menu from '../models/menuModel.js';

export const addToCart = async (employeeId, itemData) => {
  const { item_id, quantity } = itemData;

  const item = await Menu.findById(item_id);
  if (!item) throw new Error("ITEM_NOT_FOUND");

  if (item.is_available === false) {
    throw new Error("ITEM_UNAVAILABLE");
  }

  const cart = await Cart.findOrCreateCart(employeeId);

  const cartDetails = await Cart.getDetails(cart.cart_id);
  
  const existingItem = cartDetails.find(i => Number(i.item_id) === Number(item_id));

  if (existingItem) {
    const totalNewQty = Number(existingItem.quantity) + Number(quantity);
    
    if (item.stock_qty < totalNewQty) throw new Error("INSUFFICIENT_STOCK");

    return await Cart.updateItem(existingItem.cart_item_id, totalNewQty);
  }

  if (item.stock_qty < quantity) throw new Error("INSUFFICIENT_STOCK");

  return await Cart.addItem(cart.cart_id, item_id, quantity);
};

export const viewCart = async (employeeId) => {
  return await Cart.viewCart(employeeId);
};

export const clearStall = async (employeeId, stallId) => {
  const cart = await Cart.findOrCreateCart(employeeId);
  
  const numericStallId = Number(stallId);
  
  const result = await Cart.clearCart(cart.cart_id, numericStallId);
  
  console.log(`Clearing Stall ${numericStallId} for Cart ${cart.cart_id}. Rows affected: ${result.rowCount}`);
  
  return result;
};

export const removeFromCart = async (cartItemId) => {
  return await Cart.removeItem(cartItemId);
};

export const updateItem = async (cartItemId, quantity) => {
  return await Cart.updateItem(cartItemId, quantity);
};