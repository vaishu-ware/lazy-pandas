/*const express = require("express");
const router = express.Router();

const Chat = require("../models/chatModel");

// Create or get one-to-one chat
router.post("/", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    // For now, we will get the logged-in user's ID
    // from the request body.
    const currentUserId = req.body.currentUserId;

    if (!currentUserId) {
      return res.status(400).json({
        message: "Current user ID is required",
      });
    }

    // Check whether a one-to-one chat already exists
    let chat = await Chat.findOne({
      isGroupChat: false,
      users: {
        $all: [currentUserId, userId],
      },
    })
      .populate("users", "-password")
      .populate("latestMessage");

    // If chat already exists, return it
    if (chat) {
      return res.status(200).json(chat);
    }

    // Otherwise create a new chat
    const newChat = await Chat.create({
      chatName: "sender",
      isGroupChat: false,
      users: [currentUserId, userId],
    });

    const fullChat = await Chat.findById(newChat._id)
      .populate("users", "-password");

    res.status(201).json(fullChat);

  } catch (error) {
    console.error("Chat creation error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router; */


//added later to add group chat
const express = require("express");

const router = express.Router();

//imports 
const {
  accessChat,
  createGroupChat,
  getUserGroups,
} = require("../controllers/chatController");

const { protect } = require("../middleware/authMiddleware");


// Create / find one-to-one chat
router.post("/", protect, accessChat);


// Create group chat
router.post("/group", protect, createGroupChat);

//route for groups 
router.get("/groups", protect, getUserGroups);

module.exports = router;