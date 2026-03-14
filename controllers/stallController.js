import * as stallService from '../services/stallService.js';

export const createStall = async (req, res) => {
  const { stall_name, location } = req.body;

  try {
    const stall = await stallService.createNewStall(stall_name, location);

    res.status(201).json({
      message: `Stall "${stall_name}" created successfully!`,
      stall
    });
  } catch (error) {
    // Handle the logic error thrown by the Service
    if (error.message === "DUPLICATE_STALL_NAME") {
      return res.status(400).json({
        message: `The name "${stall_name}" is already taken. Please choose a different stall name.`
      });
    }

    // Handle generic server errors
    res.status(500).json({ message: 'Server error: Could not create stall' });
  }
};

export const getAllStalls = async (req, res) => {
  try {
    const stalls = await stallService.getStalls();
    // Keep this as is, usually GET lists don't need a "Success" message 
    // because the data itself is the success indicator.
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

    // Dynamic message showing the new state
    const statusText = is_active ? "Activated" : "Deactivated";
    res.status(200).json({
      message: `Stall #${stall_id} has been ${statusText}`,
      stall: updated
    });
  } catch (error) {
    res.status(500).json({ message: "Update failed: Internal server error" });
  }
};

export const deleteStall = async (req, res) => {
  const { stall_id } = req.body;
  try {
    const deleted = await stallService.deleteStall(stall_id);
    if (!deleted) return res.status(404).json({ message: "Stall not found" });

    // Improved message to confirm which ID was removed
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