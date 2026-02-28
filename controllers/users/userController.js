import pool from '../../db.js';
import bcrypt from 'bcrypt';

export const getUserProfile = async (req, res) => {
    const { employee_id } = req.user;
    try {
        const user = await pool.query(
            'SELECT employee_id, full_name, email, department, profile_picture_url FROM users WHERE employee_id = $1', 
            [employee_id]
        );
        res.json(user.rows[0]);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

export const editUserProfile = async (req, res) => {
  const { full_name, email, department, password } = req.body;
  const { employee_id } = req.user;

  try {
    const validDepts = ['CAHS', 'CAS', 'CCJE', 'CEA', 'CELA', 'CHTM', 'CITE', 'CMA'];
    if (department && !validDepts.includes(department)) {
      return res.status(400).json({ message: 'Invalid department type' });
    }

    let query = 'UPDATE users SET full_name = $1, email = $2, department = $3';
    let values = [full_name, email, department];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password_hash = $4 WHERE employee_id = $5 RETURNING *';
      values.push(hashedPassword, employee_id);
    } else {
      query += ' WHERE employee_id = $4 RETURNING *';
      values.push(employee_id);
    }

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password_hash, ...updatedUser } = result.rows[0];
    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateProfilePicture = async (req, res) => {
    try {
        const { employee_id } = req.user; 
        
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const imageUrl = `uploads/${req.file.filename}`;

        const result = await pool.query(
            'UPDATE users SET profile_picture_url = $1 WHERE employee_id = $2 RETURNING *',
            [imageUrl, employee_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Upload successful',
            profile_picture_url: imageUrl
        });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const deleteUser = async (req, res) => {
  const { employee_id } = req.body;
  try {
    const result = await pool.query('DELETE FROM users WHERE employee_id = $1 RETURNING *', [employee_id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'User deleted successfully', deletedUser: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
