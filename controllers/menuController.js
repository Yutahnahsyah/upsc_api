import * as menuService from '../services/menuService.js';

export const addItem = async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      stall_id: req.body.stall_id || req.user.stall_id,
      item_image_url: req.file ? `/uploads/${req.file.filename}` : null
    };

    const item = await menuService.addItem(itemData);
    res.status(201).json({
      message: `"${item.item_name}" added to your menu!`,
      item
    });
  } catch (error) {
    if (error.message === "REQUIRED_FIELDS_MISSING") {
      return res.status(400).json({
        message: "Please fill in all required fields (Name, Category, and Price)."
      });
    }

    if (error.message === "DUPLICATE_ITEM_NAME") {
      return res.status(400).json({
        message: `An item named "${req.body.item_name}" already exists.`
      });
    }

    res.status(500).json({ message: 'Server error: Could not add menu item' });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (req.file) updates.item_image_url = `/uploads/${req.file.filename}`;

    const updated = await menuService.updateMenuItem(id, updates);
    if (!updated) return res.status(404).json({ message: "Item not found" });

    let successMessage = "Update successful";

    if (req.file) {
      successMessage = "Image updated successfully";
    } else if ('is_available' in updates) {
      successMessage = updates.is_available
        ? `"${updated.item_name}" is now Available`
        : `"${updated.item_name}" is now Unavailable`;
    } else if ('stock_qty' in updates) {
      successMessage = `Stock updated to ${updates.stock_qty}`;
    } else if ('price' in updates) {
      successMessage = `Price updated to ₱${updates.price}`;
    } else if ('category' in updates) {
      successMessage = `Category changed to ${updates.category}`;
    } else if ('item_name' in updates) {
      successMessage = `Renamed to "${updates.item_name}"`;
    } else if ('description' in updates) {
      successMessage = "Description updated";
    }

    res.status(200).json({
      message: successMessage,
      item: updated
    });
  } catch (error) {
    const errorMessages = {
      "NAME_REQUIRED": "Item name cannot be empty.",
      "CATEGORY_REQUIRED": "Category cannot be empty.",
      "DUPLICATE_ITEM_NAME": "Another item already uses this name.",
      "INVALID_PRICE": "Please enter a valid price."
    };

    if (errorMessages[error.message]) {
      return res.status(400).json({ message: errorMessages[error.message] });
    }

    res.status(500).json({ message: "Update failed: Internal server error" });
  }
};

export const getStallMenu = async (req, res) => {
  const { stallId } = req.params;

  try {
    const items = await menuService.getMenuByStall(stallId);
    res.status(200).json(items);
  } catch (error) {
    console.error("Error retrieving menu items:", error);
    res.status(500).json({ message: 'Failed to retrieve menu items' });
  }
};

export const deleteMenuItem = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await menuService.deleteMenuItem(id);

    if (!deleted) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({
      message: `"${deleted.item_name}" has been removed`,
      item: deleted
    });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Deletion failed: Internal server error" });
  }
};

// ===================== NEW FUNCTION FOR FOOD SECTION =====================
export const getAllItems = async (req, res) => {
  try {
    const items = await menuService.getAllItems();
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching all items:", error);
    res.status(500).json({ message: 'Failed to fetch all menu items' });
  }
};