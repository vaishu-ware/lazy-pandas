const Chat = require("../models/chatModel");

// CREATE / FIND ONE-TO-ONE CHAT

const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    // Check if chat already exists between the two users
    let chat = await Chat.findOne({
      isGroupChat: false,
      users: {
        $all: [
          req.user._id,
          userId,
        ],
      },
    })
      .populate("users", "-password");

    // If chat already exists
    if (chat) {
      return res.status(200).json(chat);
    }

    // If chat doesn't exist, create one
    const newChat = await Chat.create({
      chatName: "sender",
      isGroupChat: false,
      users: [
        req.user._id,
        userId,
      ],
    });

    const fullChat = await Chat.findById(newChat._id)
      .populate("users", "-password");

    res.status(201).json(fullChat);

  } catch (error) {
    console.error("Access chat error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};



// CREATE GROUP CHAT

const createGroupChat = async (req, res) => {
  try {

    const { name, users } = req.body;

    // Check group name
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    // Check users
    if (!users || users.length < 2) {
      return res.status(400).json({
        message: "Please select at least 2 users",
      });
    }

    // Create group
    const groupChat = await Chat.create({
      chatName: name,
      isGroupChat: true,

      users: [
        ...users,
        req.user._id,
      ],

      groupAdmin: req.user._id,
    });

    // Get complete group information
    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);

  } catch (error) {

    console.error("Create group error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// GET GROUPS OF LOGGED-IN USER
const getUserGroups = async (req, res) => {
  try {
    const groups = await Chat.find({
      isGroupChat: true,
      users: req.user._id,
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Get groups error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  accessChat,
  createGroupChat,
  getUserGroups,
};