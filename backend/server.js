const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const messageRoutes =require("./routes/messageRoutes");
const http =require("http");
const initializeSocket = require("./sockets/socket");

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");


dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const io =initializeSocket(server);


// Middleware
app.use(express.json());
app.use(cors());
app.use("/api/user", userRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/chat", chatRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("🐼 LazyPandas API is running!");
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
