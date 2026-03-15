import Menu from '../models/menuModel.js';

/**
 * Validates and creates a new menu item.
 */
export const addItem = async (itemData) => {
  const { item_name, category, price, description, stall_id, stock_qty } = itemData;

  // 1. Validation: Prevent empty required fields
  // Regex for special chara and nums
  if (!item_name?.trim() || !category?.trim() || price === undefined || price === '') {
    const err = new Error("REQUIRED_FIELDS_MISSING");
    err.statusCode = 400;
    throw err;
  }

  // 2. Business Logic: Check for duplicate name in the same stall
  const existingItems = await Menu.findByStall(stall_id);
  const isDuplicate = existingItems.some(
    (item) => item.item_name.toLowerCase() === item_name.toLowerCase().trim()
  );

  if (isDuplicate) throw new Error("DUPLICATE_ITEM_NAME");

  // 3. Data Sanitization & Multiple Zeros Prevention
  const parsedPrice = parseFloat(price);

  // Ensure we have a default if stock_qty is missing, then parse to clean "000" into 0
  const stock = parseInt(stock_qty || 0, 10);

  if (isNaN(parsedPrice) || parsedPrice < 0) {
    const err = new Error("INVALID_PRICE");
    err.statusCode = 400;
    throw err;
  }

  if (isNaN(stock) || stock < 0) {
    const err = new Error("INVALID_STOCK_QUANTITY");
    err.statusCode = 400;
    throw err;
  }

  // 4. Description Indicator
  const finalDescription = (!description || !description.trim())
    ? "No description provided."
    : description.trim();

  // Create clean object to ensure sanitized values (like the single 0) are what get saved
  return await Menu.create({
    ...itemData,
    item_name: item_name.trim(),
    category: category.trim(),
    description: finalDescription,
    price: parsedPrice,
    stock_qty: stock // Explicitly use the cleaned 'stock' variable
  });
};

/**
 * Updates an existing menu item with validation checks.
 */
export const updateMenuItem = async (id, updates) => {
  const currentItem = await Menu.findById(id);
  if (!currentItem) return null;

  // 1. Validation: Prevent required fields from being empty
  if (updates.item_name !== undefined && !updates.item_name.trim()) {
    throw new Error("NAME_REQUIRED");
  }
  if (updates.category !== undefined && !updates.category.trim()) {
    throw new Error("CATEGORY_REQUIRED");
  }

  // 2. Description Indicator for Updates
  if (updates.description !== undefined) {
    updates.description = (!updates.description.trim())
      ? "No description provided."
      : updates.description.trim();
  }

  // 3. Business Logic: Check for name collisions
  if (updates.item_name && updates.item_name.trim().toLowerCase() !== currentItem.item_name.toLowerCase()) {
    const existing = await Menu.findByStall(currentItem.stall_id);
    const isTaken = existing.some(i =>
      i.item_name.toLowerCase() === updates.item_name.trim().toLowerCase() &&
      i.item_id !== parseInt(id)
    );

    if (isTaken) throw new Error("DUPLICATE_ITEM_NAME");
    updates.item_name = updates.item_name.trim();
  }

  // 4. Numeric Sanitization (Handling "000" and negatives)
  if (updates.price !== undefined) {
    const parsedPrice = parseFloat(updates.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) throw new Error("INVALID_PRICE");
    updates.price = parsedPrice;
  }

  if (updates.stock_qty !== undefined) {
    const stock = parseInt(updates.stock_qty, 10);
    if (isNaN(stock) || stock < 0) throw new Error("INVALID_STOCK_QUANTITY");
    // This re-assignment is what prevents "000" from staying in the data object
    updates.stock_qty = stock;
  }

  // 5. Boolean & Cleanup
  if (updates.is_available !== undefined) {
    updates.is_available = String(updates.is_available) === 'true';
  }

  if (updates.category) updates.category = updates.category.trim();

  return await Menu.update(id, updates);
};

export const getMenuByStall = async (stallId) => Menu.findByStall(stallId);

export const deleteMenuItem = async (id) => {
  const item = await Menu.findById(id);
  if (!item) return null;
  return await Menu.remove(id);
};

export const decrementStock = async (id, quantity) => {
  const item = await Menu.findById(id);
  if (!item) throw new Error("ITEM_NOT_FOUND");
  if (item.stock_qty < quantity) throw new Error("INSUFFICIENT_STOCK");

  return await Menu.update(id, { stock_qty: item.stock_qty - quantity });
};

// Add this to the bottom of your menuService.js
export const getMenuItemById = async (id) => Menu.findById(id);