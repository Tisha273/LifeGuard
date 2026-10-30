const mongoose = require("mongoose");

const communityPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  userAvatar: {
    type: String,
    default: "👤",
  },
  postText: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: "General Health 💡",
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: String,
    },
  ],
  comments: [
    {
      userId: String,
      username: String,
      text: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CommunityPost", communityPostSchema);
