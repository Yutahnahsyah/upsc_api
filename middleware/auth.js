import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // 2. If the user is a vendor, check their current status in the DB
    if (req.user.role === 'vendor_admin') {
      // ADDED 'stall_id' TO YOUR EXISTING QUERY
      const result = await pool.query(
        'SELECT is_active, stall_id FROM admins WHERE admin_id = $1',
        [req.user.admin_id]
      );

      const vendor = result.rows[0];

      // PRESERVED YOUR ORIGINAL LOGIC
      if (!vendor || !vendor.is_active) {
        return res.status(403).json({ 
          message: 'Your account has been archived. Session terminated.' 
        });
      }

      // NEW: REASSIGNMENT CHECK (Only for vendor_admin)
      // If the token's stall_id doesn't match the DB, the session is stale
      if (req.user.stall_id !== vendor.stall_id) {
        return res.status(401).json({ 
          message: 'Stall reassignment detected. Please log in again.' 
        });
      }
    }

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid Token' });
    }
    console.error("Middleware Error:", err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};