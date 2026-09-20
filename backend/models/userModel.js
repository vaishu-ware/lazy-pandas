const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true, //email must be unique//
    },

    password: {
      type: String,
      required: true,  //password should be converted into bcryptjs and then store.
    },

    pic: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
  },
  {
    //This will be useful later for things like: Last active , Created account  , Last updated//
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema); //creates a mongoose model called "User"//
module.exports = User;  //allows other files to use it//