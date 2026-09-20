const { Server } = require("socket.io");
const Message = require("../models/messageModel");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User joins a particular chat room
    socket.on("joinChat", (chatId) => {
      console.log("JOIN CHAT EVENT RECEIVED");
      console.log("Socket ID:", socket.id);
      console.log("Chat ID:", chatId);

      socket.join(chatId);

      console.log("Socket joined room:", chatId);
      console.log("Rooms:", socket.rooms);
    });

    // User sends a message
    socket.on("sendMessage", async (messageData) => {
      try {
        const { sender, content, chat } = messageData;

        console.log("Message received:", messageData);

        // Save message in MongoDB
        const newMessage = await Message.create({
          sender,
          content,
          chat,
          readBy:[sender],
        });

        // Get sender information
        const populatedMessage = await Message.findById(
          newMessage._id
        )
          .populate("sender", "name email pic")
          .populate("chat");

        console.log("Message saved:", populatedMessage);

        // Send message to everyone inside this chat room
        io.to(chat).emit(
          "messageReceived",
          populatedMessage
        );

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