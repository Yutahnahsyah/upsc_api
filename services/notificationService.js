import pool from '../config/db.js';

export const saveNotification = async (employee_id, title, message) => {
  const result = await pool.query(
    `INSERT INTO notifications (employee_id, title, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [employee_id, title, message]
  );
  return result.rows[0];
};

export const getNotificationsByUser = async (employee_id) => {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE employee_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [employee_id]
  );
  return result.rows;
};