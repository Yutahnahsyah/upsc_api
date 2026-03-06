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