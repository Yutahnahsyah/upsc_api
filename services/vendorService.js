import Vendor from '../models/vendorModel.js';
import bcrypt from 'bcrypt';
import db from '../config/db.js';

export const registerVendor = async (stall_id, full_name, username, password) => {
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!full_name || !nameRegex.test(full_name)) {
    throw new Error("INVALID_NAME");
  }

  const hasWhitespace = /\s/.test(password);
  if (!password || password.length < 6) {
    throw new Error("PASSWORD_LENGTH");
  }

  if (hasWhitespace) {
    throw new Error("PASSWORD_WHITESPACE");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const vendor = await Vendor.create({
    stall_id,
    full_name,
    username,
    password_hash: hashedPassword
  });

  const { password_hash, ...vendorData } = vendor;
  return vendorData;
};

export const getVendorProfile = async (adminId) => {
  const vendor = await Vendor.findByAdminIdWithStall(adminId);
  if (!vendor) {
    throw new Error("VENDOR_NOT_FOUND");
  }
  return vendor;
};

export const getVendorDashboardStats = async (stallId) => {
  // 1. Fetch the counts (Sales, Pending, etc.)
  const [sales, pending, completed, items] = await Vendor.getVendorDashboardCounts(stallId);

  // 2. Fetch the top selling items
  const topItems = await Vendor.getTopSellingItems(stallId);

  // 3. Fetch the recent activity
  const activity = await getRecentActivity(stallId);

  return {
    totalSales: parseFloat(sales.rows[0]?.total) || 0,
    pendingOrders: parseInt(pending.rows[0]?.total) || 0,
    completedOrders: parseInt(completed.rows[0]?.total) || 0,
    activeItems: parseInt(items.rows[0]?.total) || 0,
    topSellingItems: topItems,
    recentActivity: activity
  };
};

export const getRecentActivity = async (stallId) => {
  const query = `
    (SELECT 
        o.order_id as id, 
        'New Order #' || o.order_id || ' received from ' || u.full_name as message, 
        'new_order' as type, 
        o.order_time as created_at
    FROM orders o
    JOIN users u ON o.employee_id = u.employee_id 
    WHERE o.stall_id = $1)
    
    UNION ALL
    
    (SELECT 
        order_id as id, 
        -- FIX: Cast 'status' to TEXT so REPLACE can process it
        'Order #' || order_id || ' status updated to ' || REPLACE(status::TEXT, '_', ' ') as message, 
        'status_change' as type, 
        order_time as created_at
    FROM orders 
    WHERE stall_id = $1 AND status != 'pending')
    
    ORDER BY created_at DESC
    LIMIT 10;
  `;

  const result = await db.query(query, [stallId]);
  return result.rows;
};

export const fetchVendors = async () => {
  return await Vendor.findAllWithStalls();
};

export const archiveVendor = async (admin_id) => {
  // We set is_active to false to "Archive"
  return await Vendor.updateStatus(admin_id, false);
};

export const reactivateVendor = async (admin_id) => {
  return await Vendor.updateStatus(admin_id, true);
};

export const resetVendorPassword = async (adminId, newPassword) => {
  // Reuse your validation logic
  const hasWhitespace = /\s/.test(newPassword);
  if (!newPassword || newPassword.length < 6) {
    throw new Error("PASSWORD_LENGTH");
  }
  if (hasWhitespace) {
    throw new Error("PASSWORD_WHITESPACE");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  return await Vendor.updatePassword(adminId, hashedPassword);
};

export const updateVendor = async (adminId, updateData) => {
  const { full_name, username, stall_id } = updateData;

  // 1. Validate Name (same regex as registration)
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!full_name || !nameRegex.test(full_name)) {
    throw new Error("INVALID_NAME");
  }

  // 2. Perform Update
  const updatedVendor = await Vendor.update(adminId, {
    full_name,
    username,
    stall_id
  });

  if (!updatedVendor) {
    throw new Error("VENDOR_NOT_FOUND");
  }

  return updatedVendor;
};