import pool from '../../db.js';

export const deleteVendor = async (req, res) => {
  const { admin_id } = req.body;

  try {
    const result = await pool.query(
      'DELETE FROM admins WHERE admin_id = $1 RETURNING *', 
      [admin_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.status(200).json({ 
      message: 'Vendor deleted successfully', 
      deletedVendor: result.rows[0] 
    });
  } catch (error) {
    console.error("Delete Vendor Error:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};