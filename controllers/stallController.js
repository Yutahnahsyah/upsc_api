import * as stallService from '../services/stallService.js';
import pool from '../config/db.js';

export const createStall = async (req, res) => {
  const { stall_name, location } = req.body;

  try {
    const stall = await stallService.createNewStall(stall_name, location);

    res.status(201).json({
      message: `Stall "${stall_name}" created successfully!`,
      stall
    });
  } catch (error) {
    if (error.message === "DUPLICATE_STALL_NAME") {
      return res.status(400).json({
        message: `The name "${stall_name}" is already taken. Please choose a different stall name.`
      });
    }
    res.status(500).json({ message: 'Server error: Could not create stall' });
  }
};

export const getAllStalls = async (req, res) => {
  try {
    const stalls = await stallService.getStalls();
    res.status(200).json(stalls);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve stalls' });
  }
};

export const updateStallStatus = async (req, res) => {
  const { stall_id, is_active } = req.body;
  try {
    const updated = await stallService.updateStallStatus(stall_id, is_active);
    if (!updated) return res.status(404).json({ message: `Stall #${stall_id} not found` });

    const statusText = is_active ? 'Restored' : 'Archived';  // 👈 changed
    res.status(200).json({
      message: `Stall "${updated.stall_name}" has been ${statusText}`,  // 👈 changed
      stall: updated
    });
  } catch (error) {
    res.status(500).json({ message: 'Update failed: Internal server error' });
  }
};

export const deleteStall = async (req, res) => {
  const { stall_id } = req.body;
  try {
    const deleted = await stallService.deleteStall(stall_id);
    if (!deleted) return res.status(404).json({ message: "Stall not found" });

    res.status(200).json({
      message: `Stall #${stall_id} removed from directory`,
      stall: deleted
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Deletion failed: Ensure no vendors are assigned to this stall" });
  }
};

export const getActiveStalls = async (req, res) => {
  try {
    const stalls = await stallService.getActiveStalls();
    res.status(200).json(stalls);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve active stalls' });
  }
};

export const getFoodsByStall = async (req, res) => {
    const { id } = req.params; 
    try {
        const query = `
            SELECT * FROM menu_items 
            WHERE stall_id = $1 
            AND is_available = true
        `;
        const result = await pool.query(query, [id]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching menu items:', err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const updateStallProfile = async (req, res) => {
  try {
    const { id } = req.params; 
    const { stall_name, location } = req.body;

    const updates = {};
    if (stall_name) updates.stall_name = stall_name;
    if (location) updates.location = location;

    if (req.file) {
      updates.stall_image_url = `/uploads/${req.file.filename}`;
    }

    const updated = await stallService.updateStallInfo(id, updates);
    
    res.status(200).json({
      message: `Stall "${updated.stall_name}" updated successfully`,
      stall: updated
    });
  } catch (error) {
    if (error.message === "DUPLICATE_STALL_NAME") {
      return res.status(400).json({ message: "That stall name is already in use." });
    }
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Update failed: Internal server error" });
  }
};

export const getStallDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const stall = await stallService.getStallById(id);
    if (!stall) return res.status(404).json({ message: "Stall not found" });
    res.status(200).json(stall);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stall details" });
  }
};