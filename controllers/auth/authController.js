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


export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1', 
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const admin = result.rows[0];

    if (admin.password_hash !== password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.status(200).json({
      message: "Login successful",
      admin: {
        id: admin.admin_id,
        full_name: admin.full_name,
        role: admin.role
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};