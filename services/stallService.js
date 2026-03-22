import Stall from '../models/stallModel.js';

export const createNewStall = async (name, location) => {
  const existingStall = await Stall.findByName(name);
  if (existingStall) {
    throw new Error("DUPLICATE_STALL_NAME");
  }
  return await Stall.create(name, location);
};

export const getStalls = async () => {
  return await Stall.findAll();
};

export const updateStallActiveStatus = async (id, is_active) => {
  const updated = await Stall.updateActiveStatus(id, is_active);
  if (!is_active) {
    await Stall.updateOpenStatus(id, false);
  }
  return updated;
};

export const updateStallOpenStatus = async (id, is_open) => {
  const updated = await Stall.updateOpenStatus(id, is_open);
  if (!updated) throw new Error("STALL_NOT_FOUND");
  return updated;
};

export const updateStall = async (id, updates) => {
  const updatedStall = await Stall.update(id, updates);
  if (!updatedStall) throw new Error("STALL_NOT_FOUND");
  return updatedStall;
};

export const deleteStall = async (stall_id) => {
  const vendorCount = await Stall.getVendorCount(stall_id);
  if (vendorCount > 0) {
    const error = new Error("Cannot delete: Vendors still assigned.");
    error.statusCode = 400;
    throw error;
  }
  return await Stall.remove(stall_id);
};

export const getActiveStalls = async () => {
  return await Stall.findActive();
};

export const getStallById = async (id) => {
  return await Stall.findById(id);
};

export const updateStallInfo = async (id, updates) => {
  if (updates.stall_name) {
    const existing = await Stall.findByName(updates.stall_name);
    if (existing && existing.stall_id !== parseInt(id)) {
      throw new Error("DUPLICATE_STALL_NAME");
    }
  }
  const updatedStall = await Stall.update(id, updates);
  if (!updatedStall) throw new Error("STALL_NOT_FOUND");
  return updatedStall;
};

export const getStallDashboardStats = async (stallId) => {
  const [sales, pending, completed, items] = await Stall.getDashboardCounts(stallId);

  const topItems = await Stall.getTopSellingItems(stallId);
  const activity = await Stall.getRecentActivity(stallId);

  return {
    totalSales: parseFloat(sales.rows[0]?.total) || 0,
    pendingOrders: parseInt(pending.rows[0]?.total) || 0,
    completedOrders: parseInt(completed.rows[0]?.total) || 0,
    activeItems: parseInt(items.rows[0]?.total) || 0,
    topSellingItems: topItems,
    recentActivity: activity
  };
};

export const getStallOverallStats = async (stallId) => {
  const [totalEarnings, totalCompleted, totalCancelled, totalOrders] = await Stall.getOverallStats(stallId);

  return {
    totalEarnings: parseFloat(totalEarnings.rows[0]?.total) || 0,
    totalCompleted: parseInt(totalCompleted.rows[0]?.total) || 0,
    totalCancelled: parseInt(totalCancelled.rows[0]?.total) || 0,
    totalOrders: parseInt(totalOrders.rows[0]?.total) || 0,
  };
};