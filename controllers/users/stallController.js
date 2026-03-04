import pool from '../../db.js';

export const updateStallStatus = async (req, res) => {
  const { stall_id, is_active } = req.body;

  try {
    const result = await pool.query(
      "UPDATE stalls SET is_active = $1 WHERE stall_id = $2 RETURNING *",
      [is_active, stall_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Stall not found" });
    }

    res.status(200).json({
      message: `Stall is now ${is_active ? "Active" : "Inactive"}`,
      stall: result.rows[0],
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Failed to update stall status" });
  }
};

export const deleteStall = async (req, res) => {
  const { stall_id } = req.body;

  try {
    const result = await pool.query(
      'DELETE FROM stalls WHERE stall_id = $1 RETURNING *',
      [stall_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Stall not found. It may have already been deleted."
      });
    }

    res.status(200).json({
      success: true,
      message: `Stall #${stall_id} ("${result.rows[0].stall_name}") deleted successfully.`,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error in deleteStall controller:", error);

    // PostgreSQL Error Code 23503: Foreign Key Violation
    // This happens if a Vendor/Admin is still linked to this stall_id
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        message: "Cannot delete this stall because vendors are currently assigned to it. Unassign them first."
      });
    }

    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while trying to delete the stall."
    });
  }
};