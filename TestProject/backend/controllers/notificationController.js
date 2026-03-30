const Notification = require('../models/Notification');

// ── Get my notifications ──────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { unreadOnly } = req.query;

    const filter = { userId };
    if (unreadOnly === 'true') filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
};

// ── Mark notification as read ─────────────────
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.json({ notification: notif });
  } catch (err) { next(err); }
};

// ── Mark all as read ──────────────────────────
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.userId, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

// ── Delete notification ───────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndDelete({ _id: id, userId: req.user.userId });
    res.json({ message: 'Notification deleted' });
  } catch (err) { next(err); }
};

// ── Clear all notifications ───────────────────
const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ userId: req.user.userId });
    res.json({ message: 'All notifications cleared' });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification, clearAllNotifications };
