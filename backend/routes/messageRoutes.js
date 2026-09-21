const express = require("express");

const router = express.Router();

const {
  sendMessage,
  getMessages,
  getUnreadCount,
  markMessagesAsRead,
  getNotifications,
} = require("../controllers/messageController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, sendMessage);

router.get("/unread/count", protect, getUnreadCount);

router.get("/notifications", protect, getNotifications);

router.put ("/read/:chatId", protect, markMessagesAsRead);

router.get("/:chatId", protect, getMessages);

module.exports = router;