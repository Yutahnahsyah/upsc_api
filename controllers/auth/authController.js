import bcrypt from 'bcrypt';
import pool from '../../db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async (req, res) => {
  const { employee_id, full_name, email, password, department } = req.body;
  try {
    const validDepts = ['CAHS', 'CAS', 'CCJE', 'CEA', 'CELA', 'CHTM', 'CITE', 'CMA'];
    if (!validDepts.includes(department)) {
      return res.status(400).json({ message: 'Invalid department type' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (employee_id, full_name, email, password_hash, department) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [employee_id, full_name, email, hashedPassword, department]
    );

    const { password_hash, ...userWithoutPassword } = result.rows[0];
    res.status(201).json({
      message: 'User Registered',
      user: userWithoutPassword
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email or Employee ID already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ message: 'Invalid Credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const token = jwt.sign({ employee_id: user.employee_id }, JWT_SECRET);
    res.json({ message: "Login Successful", token });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const registerAdmin = async (req, res) => {
  const { full_name, username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const stall_id = null;
    const profile_picture_url = null;
    const role = 'head_admin';

    const result = await pool.query(
      `INSERT INTO admins (stall_id, full_name, username, password_hash, profile_picture_url, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [stall_id, full_name, username, hashedPassword, profile_picture_url, role]
    );

    const { password_hash, ...adminWithoutPassword } = result.rows[0];

    res.status(201).json({
      message: 'Admin Registered Successfully',
      admin: adminWithoutPassword
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Fetch the user from the database
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const admin = result.rows[0];

    // 2. Role Authorization: Strictly check for head_admin
    // This prevents vendors from accessing the main admin portal
    if (admin.role !== 'head_admin') {
      return res.status(403).json({ 
        message: 'Access Denied: High-level administrative privileges required.' 
      });
    }

    // 3. Password Verification
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // 4. Generate Token
    // We include the role in the payload so the Frontend can gate UI elements
    const token = jwt.sign(
      { 
        admin_id: admin.admin_id, 
        role: admin.role 
      }, 
      JWT_SECRET,
      { expiresIn: '12h' } 
    );

    res.json({ 
      message: "Login Successful", 
      token,
      role: admin.role 
    });

  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const registerVendor = async (req, res) => {
  const { full_name, username, password, stall_id } = req.body;

  // 1. Validation: Prevent username and full_name from being identical
  if (username.toLowerCase() === full_name.toLowerCase()) {
    return res.status(400).json({ 
      message: 'Username and Full Name cannot be the same for security and clarity' 
    });
  }

  // 2. Validation: Vendors MUST be tied to a stall
  if (!stall_id) {
    return res.status(400).json({ 
      message: 'stall_id is required for vendor registration' 
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const profile_picture_url = null;
    const role = 'vendor_admin';

    const result = await pool.query(
      `INSERT INTO admins (stall_id, full_name, username, password_hash, profile_picture_url, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [stall_id, full_name, username, hashedPassword, profile_picture_url, role]
    );

    const { password_hash, ...vendorData } = result.rows[0];

    res.status(201).json({
      message: 'Vendor Registered Successfully',
      admin: vendorData
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Username already exists' });
    }

    if (error.code === '23503') {
      return res.status(400).json({ message: 'The provided stall_id does not exist' });
    }
    
    console.error('Vendor Registration Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const loginVendor = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Fetch user by username
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const vendor = result.rows[0];

    // 2. Role Authorization: Ensure this user is actually a vendor_admin
    if (vendor.role !== 'vendor_admin') {
      return res.status(403).json({ message: 'Access denied. This portal is for vendors only.' });
    }

    // 3. Password Verification
    const isMatch = await bcrypt.compare(password, vendor.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // 4. Generate Token (Including stall_id for vendor context)
    const token = jwt.sign(
      { 
        admin_id: vendor.admin_id, 
        role: vendor.role,
        stall_id: vendor.stall_id // Useful for filtering stall-specific data
      }, 
      JWT_SECRET,
      { expiresIn: '24h' } // Optional: set an expiration
    );

    res.json({ 
      message: "Login Successful", 
      token,
      stall_id: vendor.stall_id // Send stall_id back so frontend can use it
    });

  } catch (error) {
    console.error('Vendor Login Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createStall = async (req, res) => {
  const { stall_name, location } = req.body;

  // 1. Validation: Only require the essentials
  if (!stall_name || !location) {
    return res.status(400).json({ 
      message: 'Stall name and location are required to initialize a stall.' 
    });
  }

  try {
    // 2. Insert into database
    // stall_image_url will remain NULL initially
    const result = await pool.query(
      `INSERT INTO stalls (stall_name, location) 
       VALUES ($1, $2) 
       RETURNING *`,
      [stall_name, location]
    );

    res.status(201).json({
      message: 'Stall initialized successfully. Vendor can now upload images.',
      stall: result.rows[0]
    });

  } catch (error) {
    console.error('Stall Creation Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};