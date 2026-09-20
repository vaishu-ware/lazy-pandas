//This allows the controller to communicate with MongoDB through Mongoose.
const User = require("../models/userModel");   //Go one folder up, then go into models//
const bcrypt = require("bcryptjs"); // never store plain-text passwords so used bcrypt//
const jwt = require("jsonwebtoken");


// Register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, pic } = req.body;    //get data from the request
    
     const profilePic =
      pic ||
      "https://api.dicebear.com/10.x/adventurer/svg?seed=default";


    // Check if all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please enter all required fields",
      });
    }

    //clean the email
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      pic:profilePic,
    });

    // Check user in database
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        pic: user.pic,
      });
    } else {
      res.status(400).json({
        message: "Failed to create user",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare entered password with hashed password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    // Check password
    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Send response
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: token,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ // here user.find gets all the users from mongodb.and 
      _id: { $ne: req.user._id },   // dont return currently looged in user
    }).select("-password");         // get the users but dont return password.

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
};