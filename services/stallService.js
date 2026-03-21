import Stall from '../models/stallModel.js';

export const createNewStall = async (name, location) => {
  // 1. Business Logic: Check if name already exists
  const existingStall = await Stall.findByName(name);

  if (existingStall) {
    // Throwing a key so the controller can decide the message
    throw new Error("DUPLICATE_STALL_NAME");
  }

  // 2. Execution: Proceed with creation if unique
  return await Stall.create(name, location);
};

export const getStalls = async () => {
  return await Stall.findAll();
};

export const updateStallStatus = async (id, is_active) => {
  return await Stall.updateStatus(id, is_active);
};

// --- NEW FUNCTION ADDED BELOW ---
export const updateStall = async (id, updates) => {
  // We use the generic update method we added to the model
  const updatedStall = await Stall.update(id, updates);

  if (!updatedStall) {
    throw new Error("STALL_NOT_FOUND");
  }

  return updatedStall;
};
// --- END OF NEW FUNCTION ---

export const deleteStall = async (stall_id) => {
  // Logic: Check if vendors are assigned before allowing deletion
  const vendorCount = await Stall.getVendorCount(stall_id);

  if (vendorCount > 0) {
    // We throw a custom error that the controller can catch
    const error = new Error("Cannot delete: Vendors still assigned.");
    error.statusCode = 400;
    throw error;
  }

  return await Stall.remove(stall_id);
};

export const getActiveStalls = async () => {
  return await Stall.findActive();
};

// Add this to your stallService.js
export const getStallById = async (id) => {
  return await Stall.findById(id);
};

// Add/Update this in stallService.js
export const updateStallInfo = async (id, updates) => {
  // 1. Validation: If they are changing the name, check if the NEW name exists elsewhere
  if (updates.stall_name) {
    const existing = await Stall.findByName(updates.stall_name);
    // If a stall exists with that name and it's NOT the current stall we are editing
    if (existing && existing.stall_id !== parseInt(id)) {
      throw new Error("DUPLICATE_STALL_NAME");
    }
  }

  // 2. Execution
  const updatedStall = await Stall.update(id, updates);
  
  if (!updatedStall) {
    throw new Error("STALL_NOT_FOUND");
  }

  return updatedStall;
};