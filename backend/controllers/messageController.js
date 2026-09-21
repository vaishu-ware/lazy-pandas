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
      readBy: [req.user._id],
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
    const userId = req.user._id;

    // Find all chats where user is a member
    const userChats = await Chat.find({ users: userId }).select("_id");
    const chatIds = userChats.map((chat) => chat._id);

    const count = await Message.countDocuments({
      chat: { $in: chatIds },
      readBy: { $ne: userId },
      sender: { $ne: userId },
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

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all chats where user is a member
    const chats = await Chat.find({
      users: userId,
    });

    // For each chat, find unread messages and get the latest one
    const notifications = await Promise.all(
      chats.map(async (chat) => {
        const latestUnread = await Message.find({
          chat: chat._id,
          sender: { $ne: userId },
          readBy: { $ne: userId },
        })
          .sort({ createdAt: -1 })
          .limit(1)
          .populate("sender", "name pic")
          .populate("chat", "chatName isGroupChat users");

        if (latestUnread.length > 0) {
          const unreadCount = await Message.countDocuments({
            chat: chat._id,
            sender: { $ne: userId },
            readBy: { $ne: userId },
          });

          // Populate chat users (exclude password)
          const populatedChat = await Chat.findById(
            latestUnread[0].chat._id
          ).populate("users", "-password");

          return {
            chat: populatedChat,
            latestMessage: latestUnread[0],
            unreadCount,
          };
        }
        return null;
      })
    );

    // Filter out nulls and sort by latest message time
    const validNotifications = notifications
      .filter((n) => n !== null)
      .sort(
        (a, b) =>
          new Date(b.latestMessage.createdAt) -
          new Date(a.latestMessage.createdAt)
      );

    res.status(200).json(validNotifications);
  } catch (error) {
    console.error("Notifications error:", error);
    res.status(500).json({ message: "Failed to get notifications" });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getUnreadCount,
  markMessagesAsRead,
  getNotifications,
};