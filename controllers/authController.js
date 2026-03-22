import * as authService from '../services/authService.js';

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await authService.authenticateUser(email, password);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await authService.authenticateAdmin(username, password);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const loginVendor = async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await authService.authenticateVendor(username, password);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Internal Server Error' });
  }
};
