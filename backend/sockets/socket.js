const { Server } = require("socket.io");
const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("setup", (userId) => {
      socket.userId = userId;
      socket.join(userId);
      console.log("User setup:", userId);
    });

    socket.on("joinChat", (chatId) => {
      console.log("JOIN CHAT EVENT RECEIVED");
      console.log("Socket ID:", socket.id);
      console.log("Chat ID:", chatId);

      socket.join(chatId);

      console.log("Socket joined room:", chatId);
      console.log("Rooms:", socket.rooms);
    });

    socket.on("leaveChat", (chatId) => {
      socket.leave(chatId);
      console.log("Socket left room:", chatId);
    });

    socket.on("sendMessage", async (messageData) => {
      try {
        const { sender, content, chat } = messageData;

        console.log("Message received:", messageData);

        const newMessage = await Message.create({
          sender,
          content,
          chat,
          readBy: [sender],
        });

        const populatedMessage = await Message.findById(
          newMessage._id
        )
          .populate("sender", "name email pic")
          .populate("chat");

        console.log("Message saved:", populatedMessage);

        io.to(chat).emit(
          "messageReceived",
          populatedMessage
        );

        const fullChat = await Chat.findById(chat)
          .populate("users", "-password");

        const recipients = fullChat.users.filter(
          (u) => u._id.toString() !== sender
        );

        for (const recipient of recipients) {
          const recipientId = recipient._id.toString();

          const chatUnreadCount = await Message.countDocuments({
            chat: chat,
            sender: { $ne: recipientId },
            readBy: { $ne: recipientId },
          });

          // Get recipient's chats for total unread count
          const recipientChats = await Chat.find({ users: recipientId }).select("_id");
          const recipientChatIds = recipientChats.map((c) => c._id);

          const totalUnreadCount = await Message.countDocuments({
            chat: { $in: recipientChatIds },
            sender: { $ne: recipientId },
            readBy: { $ne: recipientId },
          });

          io.to(recipientId).emit("unreadCountUpdate", {
            chatId: chat,
            chatUnreadCount,
            totalUnreadCount,
          });
        }

        console.log("Message emitted to room:", chat);

      } catch (error) {
        console.error(
          "Socket message error:",
          error.message
        );

        socket.emit("messageError", {
          message: error.message,
        });
      }
    });

    socket.on("markMessagesRead", async ({ chatId, userId }) => {
      try {
        await Message.updateMany(
          {
            chat: chatId,
            sender: { $ne: userId },
            readBy: { $ne: userId },
          },
          {
            $addToSet: {
              readBy: userId,
            },
          }
        );

        io.to(chatId).emit("messagesRead", { chatId, userId });
        io.to(userId).emit("messagesRead", { chatId, userId });

        const fullChat = await Chat.findById(chatId)
          .populate("users", "-password");

        const recipients = fullChat.users.filter(
          (u) => u._id.toString() !== userId
        );

        for (const recipient of recipients) {
          const recipientId = recipient._id.toString();

          const chatUnreadCount = await Message.countDocuments({
            chat: chatId,
            sender: { $ne: recipientId },
            readBy: { $ne: recipientId },
          });

          // Get recipient's chats for total unread count
          const recipientChats = await Chat.find({ users: recipientId }).select("_id");
          const recipientChatIds = recipientChats.map((chat) => chat._id);

          const totalUnreadCount = await Message.countDocuments({
            chat: { $in: recipientChatIds },
            sender: { $ne: recipientId },
            readBy: { $ne: recipientId },
          });

          io.to(recipientId).emit("unreadCountUpdate", {
            chatId: chatId,
            chatUnreadCount,
            totalUnreadCount,
          });
        }
      } catch (error) {
        console.error("Socket mark read error:", error.message);
        socket.emit("readError", {
          message: error.message,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(
        "User disconnected:",
        socket.id
      );
    });
  });

  return io;
};

module.exports = initializeSocket;
