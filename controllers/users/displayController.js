import pool from '../../db.js';

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT employee_id, full_name, email, department, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getAllStalls = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT stall_id, stall_name, location, is_active FROM stalls ORDER BY stall_id DESC'
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch Stalls Error:', error);
    res.status(500).json({ message: 'Failed to retrieve stalls' });
  }
};

export const getAllVendors = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.admin_id, 
        a.full_name, 
        a.username, 
        a.stall_id, 
        s.stall_name,
        a.created_at
      FROM admins a
      LEFT JOIN stalls s ON a.stall_id = s.stall_id
      WHERE a.role = 'vendor_admin'
      ORDER BY a.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch Vendors Error:', error);
    res.status(500).json({ message: 'Failed to retrieve vendor accounts' });
  }
};