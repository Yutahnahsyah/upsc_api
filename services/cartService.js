import Cart from '../models/cartModel.js';
import Menu from '../models/menuModel.js';

export const addToCart = async (employeeId, itemData) => {
  const { item_id, quantity, item_remarks } = itemData;

  // 1. Check if item exists and has stock
  const item = await Menu.findById(item_id);
  if (!item) throw new Error("ITEM_NOT_FOUND");
  if (item.stock_qty < quantity) throw new Error("INSUFFICIENT_STOCK");

  // 2. Get user's cart
  const cart = await Cart.findOrCreateCart(employeeId);

  // 3. Add to cart_items
  return await Cart.addItem(cart.cart_id, item_id, quantity, item_remarks || "");
};

export const viewCart = async (employeeId) => {
  const cart = await Cart.findOrCreateCart(employeeId);
  return await Cart.getDetails(cart.cart_id);
};