import * as userService from '../services/userService.js';

export const registerUser = async (req, res) => {
  try {
    const user = await userService.registerUser(req.body);

    res.status(201).json({
      message: 'User Registered Successfully',
      user
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(error.status || 500).json({
      message: error.message || 'Internal Server Error'
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.fetchUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await userService.fetchProfile(req.user.employee_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const editUserProfile = async (req, res) => {
  try {
    const updatedUser = await userService.editUser(req.user.employee_id, req.body);

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(error.status || 500).json({
      message: error.message || 'Internal Server Error'
    });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = `uploads/${req.file.filename}`;
    const updatedUser = await userService.updateAvatar(req.user.employee_id, imageUrl);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile picture updated successfully',
      profile_picture_url: imageUrl,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { employee_id } = req.body;
    const deletedUser = await userService.deleteUser(employee_id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Deleted successfully',
      user: deletedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};