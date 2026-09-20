const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({
      message: "Content and chatId are required",
    });
  }

  try {
    let message = await Message.create({
      sender: req.user._id,
      content: content,
      chat: chatId,
      readBy: [ref.user._id],
    });

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");

    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      chat: req.params.chatId,
    })

    .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      readBy: { $ne: req.user._id },
      sender: { $ne: req.user._id },
    });

    res.status(200).json({
      unreadCount: count,
    });

  } catch (error) {
    console.error("Unread count error:", error);

    res.status(500).json({
      message: "Failed to get unread count",
    });
  }
};


const markMessagesAsRead = async (req, res) => {

  try {

    const { chatId } = req.params;

    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: {
          readBy: req.user._id,
        },
      }
    );

    res.status(200).json({
      message: "Messages marked as read",
    });

  } catch (error) {

    console.error(
      "Mark as read error:",
      error
    );

    res.status(500).json({
      message: "Failed to mark messages as read",
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getUnreadCount,
  markMessagesAsRead,
};