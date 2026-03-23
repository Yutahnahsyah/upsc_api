import * as notificationService from '../services/notificationService.js';

export const getNotifications = async (req, res) => {
  const { employee_id } = req.user;
  try {
    const notifications = await notificationService.getNotificationsByUser(employee_id);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};