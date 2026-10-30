const express = require("express");
const router = express.Router();
const CommunityPost = require("../models/CommunityPost");
const auth = require("../middleware/auth");

/* ================= GET ALL POSTS (PUBLIC/AUTH) ================= */
router.get("/", async (req, res) => {
  try {
    const posts = await CommunityPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error("Community fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ================= CREATE POST ================= */
router.post("/add", auth, async (req, res) => {
  try {
    const { postText, category } = req.body;
    const userId = req.user._id || req.user.id;
    const username = req.user.name || "Community Member";

    if (!postText || !postText.trim()) {
      return res.status(400).json({ message: "Post text cannot be empty" });
    }

    const newPost = new CommunityPost({
      userId,
      username,
      postText: postText.trim(),
      category: category || "General Health 💡",
      likes: 0,
      likedBy: [],
      comments: [],
    });

    await newPost.save();
    res.status(201).json({ message: "Post shared successfully", post: newPost });
  } catch (error) {
    console.error("Community add error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ================= LIKE POST ================= */
router.post("/:id/like", auth, async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyLiked = post.likedBy?.includes(userId);

    if (alreadyLiked) {
      post.likes = Math.max(0, post.likes - 1);
      post.likedBy = post.likedBy.filter((id) => id !== userId);
    } else {
      post.likes = (post.likes || 0) + 1;
      if (!post.likedBy) post.likedBy = [];
      post.likedBy.push(userId);
    }

    await post.save();
    res.json({ likes: post.likes, liked: !alreadyLiked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================= ADD COMMENT ================= */
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    const userId = (req.user._id || req.user.id).toString();
    const username = req.user.name || "Community Member";

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      userId,
      username,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    res.status(201).json({ message: "Comment added", comments: post.comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ================= DELETE POST ================= */
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Allow author or admin
    if (post.userId && post.userId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await CommunityPost.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
