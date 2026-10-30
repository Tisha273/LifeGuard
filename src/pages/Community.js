import React, { useState, useEffect, useContext } from "react";
import { LangContext } from "../App";
import api from "../api";
import Swal from "sweetalert2";
import "./Community.css";

export default function Community() {
  const { lang } = useContext(LangContext);
  const user = JSON.parse(localStorage.getItem("lg_user") || "{}");
  const userId = (user?._id || user?.id || "").toString();

  const t = {
    en: {
      badge: "Peer Health & Support Forum",
      title: "Community Discussions",
      subtitle: "Share your recovery journey, ask health questions, exchange medication tips, and support each other.",
      composerPlaceholder: "Share a health tip, ask a question, or post your recovery journey...",
      postBtn: "Post to Community",
      categories: [
        "General Health 💡",
        "Heart Recovery ❤️",
        "Medication Advice 💊",
        "Ask a Question ❓",
        "Diet & Fitness 🥗",
      ],
      tabs: [
        { key: "All", label: "🌟 All Discussions" },
        { key: "Health", label: "General Health" },
        { key: "Heart", label: "Heart Recovery" },
        { key: "Medication", label: "Medication" },
        { key: "Question", label: "Q&A" },
      ],
      emptyTitle: "No posts yet in this category",
      emptySub: "Be the first to share something helpful with the community!",
      helpful: "Helpful",
      comments: "Comments",
      deleteBtn: "🗑️ Delete",
      replyPlaceholder: "Write a helpful response...",
      replyBtn: "Reply",
      member: "Member",
      justNow: "Just now",
      minsAgo: "m ago",
      hoursAgo: "h ago",
    },
    hi: {
      badge: "सहकर्मी स्वास्थ्य व सहयोग मंच",
      title: "समुदाय स्वास्थ्य चर्चा",
      subtitle: "अपनी स्वास्थ्य यात्रा साझा करें, प्रश्न पूछें, दवा के सुझाव लें और एक-दूसरे की मदद करें।",
      composerPlaceholder: "स्वास्थ्य सलाह साझा करें, कोई प्रश्न पूछें या अपने अनुभव लिखें...",
      postBtn: "समुदाय में पोस्ट करें",
      categories: [
        "सामान्य स्वास्थ्य 💡",
        "हृदय सुधार ❤️",
        "दवा संबंधी सलाह 💊",
        "प्रश्न पूछें ❓",
        "आहार और फिटनेस 🥗",
      ],
      tabs: [
        { key: "All", label: "🌟 सभी चर्चाएं" },
        { key: "Health", label: "सामान्य स्वास्थ्य" },
        { key: "Heart", label: "हृदय सुधार" },
        { key: "Medication", label: "दवाएं" },
        { key: "Question", label: "प्रश्न-उत्तर" },
      ],
      emptyTitle: "इस श्रेणी में अभी तक कोई पोस्ट नहीं है",
      emptySub: "समुदाय के साथ उपयोगी जानकारी साझा करने वाले पहले व्यक्ति बनें!",
      helpful: "मददगार",
      comments: "टिप्पणियाँ",
      deleteBtn: "🗑️ हटाएं",
      replyPlaceholder: "अपनी प्रतिक्रिया या सलाह लिखें...",
      replyBtn: "जवाब दें",
      member: "सदस्य",
      justNow: "अभी",
      minsAgo: "मिनट पहले",
      hoursAgo: "घंटे पहले",
    },
  };

  const str = t[lang] || t.en;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General Health 💡");
  const [activeTab, setActiveTab] = useState("All");

  // Comment state tracking
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const categories = str.categories;

  /* ================= FETCH POSTS FROM BACKEND ================= */
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/community");
      if (Array.isArray(res.data)) {
        setPosts(res.data);
      }
    } catch (err) {
      console.warn("Community fetch note:", err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= CREATE POST ================= */
  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    try {
      const res = await api.post("/community/add", {
        postText: newPostText.trim(),
        category: selectedCategory,
      });

      if (res.data?.post) {
        setPosts([res.data.post, ...posts]);
      } else {
        fetchPosts();
      }

      setNewPostText("");
      Swal.fire({
        title: "Shared with Community!",
        text: "Your post is now visible to all members.",
        icon: "success",
        timer: 2000,
      });
    } catch (err) {
      console.error("Add post error:", err);
      Swal.fire("Could not share post", "Please try again later.", "error");
    }
  };

  /* ================= LIKE POST ================= */
  const handleLikePost = async (postId) => {
    try {
      const res = await api.post(`/community/${postId}/like`);
      const updatedPosts = posts.map((p) => {
        if ((p._id || p.id) === postId) {
          const likedBy = p.likedBy || [];
          const nowLiked = res.data.liked;
          return {
            ...p,
            likes: res.data.likes,
            likedBy: nowLiked ? [...likedBy, userId] : likedBy.filter((id) => id !== userId),
          };
        }
        return p;
      });
      setPosts(updatedPosts);
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  /* ================= COMMENTS ================= */
  const toggleComments = (postId) => {
    setOpenComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleAddComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      const res = await api.post(`/community/${postId}/comment`, { text });
      const updatedPosts = posts.map((p) => {
        if ((p._id || p.id) === postId) {
          return {
            ...p,
            comments: res.data.comments || [
              ...(p.comments || []),
              { username: user.name || "You", text, createdAt: new Date() },
            ],
          };
        }
        return p;
      });

      setPosts(updatedPosts);
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  /* ================= DELETE POST ================= */
  const handleDeletePost = async (postId) => {
    const res = await Swal.fire({
      title: "Delete this post?",
      text: "This discussion will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete",
    });

    if (!res.isConfirmed) return;

    try {
      await api.delete(`/community/${postId}`);
      setPosts(posts.filter((p) => (p._id || p.id) !== postId));
      Swal.fire("Deleted", "Post removed.", "success");
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire("Delete failed", "You can only delete your own posts.", "error");
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Recently";
    const date = new Date(dateStr);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    if (activeTab === "All") return true;
    return p.category?.toLowerCase().includes(activeTab.toLowerCase().split(" ")[0]);
  });

  return (
    <div className="community-container">
      {/* Header */}
      <div className="community-header">
        <h1 className="community-title">{str.title}</h1>
        <p className="community-subtitle">{str.subtitle}</p>
      </div>

      {/* Post Composer Card */}
      <div className="composer-card">
        <form onSubmit={handleAddPost}>
          <div className="composer-top">
            <div className="composer-avatar">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <textarea
              className="composer-textarea"
              placeholder={str.composerPlaceholder}
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              required
            />
          </div>

          <div className="composer-bottom">
            <div className="composer-categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`composer-cat-pill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button type="submit" className="composer-submit-btn">
              <span>{str.postBtn}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Category Tabs */}
      <div className="community-tabs">
        {str.tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`community-tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="community-posts-list">
        {filteredPosts.length === 0 ? (
          <div className="community-empty-box">
            <p style={{ fontSize: "30px", margin: "0 0 10px 0" }}>💬</p>
            <h3 style={{ margin: "0 0 6px 0" }}>{str.emptyTitle}</h3>
            <p style={{ color: "#64748b", margin: 0 }}>{str.emptySub}</p>
          </div>
        ) : (
          filteredPosts.map((p) => {
            const postId = p._id || p.id;
            const isLiked = p.likedBy?.includes(userId);
            const isAuthor = p.userId && (p.userId.toString() === userId || p.username === user.name);

            return (
              <div className="community-post-card" key={postId}>
                <div className="post-header">
                  <div className="post-author-box">
                    <div className="post-author-avatar">
                      {p.username ? p.username[0].toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="post-author-name">{p.username || str.member}</div>
                      <div className="post-time">{formatTimeAgo(p.createdAt)}</div>
                    </div>
                  </div>

                  <span className="post-cat-badge">{p.category || "Health 💡"}</span>
                </div>

                <div className="post-content">{p.postText}</div>

                <div className="post-actions-bar">
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      className={`post-action-btn ${isLiked ? "liked" : ""}`}
                      onClick={() => handleLikePost(postId)}
                    >
                      <span>{isLiked ? "❤️" : "🤍"}</span>
                      <span>{p.likes || 0} {str.helpful}</span>
                    </button>

                    <button
                      type="button"
                      className="post-action-btn"
                      onClick={() => toggleComments(postId)}
                    >
                      <span>💬</span>
                      <span>{(p.comments?.length || 0)} {str.comments}</span>
                    </button>
                  </div>

                  {isAuthor && (
                    <button
                      type="button"
                      className="post-delete-btn"
                      onClick={() => handleDeletePost(postId)}
                      title={str.deleteBtn}
                    >
                      {str.deleteBtn}
                    </button>
                  )}
                </div>

                {/* Comments Section */}
                {openComments[postId] && (
                  <div className="post-comments-container">
                    {p.comments && p.comments.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {p.comments.map((c, idx) => (
                          <div className="comment-bubble" key={idx}>
                            <div className="comment-header">
                              <span className="comment-author">{c.username || str.member}</span>
                              <span style={{ color: "#94a3b8" }}>{formatTimeAgo(c.createdAt)}</span>
                            </div>
                            <div className="comment-text">{c.text}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment input */}
                    <div className="comment-input-row">
                      <input
                        type="text"
                        className="comment-input"
                        placeholder={str.replyPlaceholder}
                        value={commentInputs[postId] || ""}
                        onChange={(e) =>
                          setCommentInputs({ ...commentInputs, [postId]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddComment(postId);
                        }}
                      />
                      <button
                        type="button"
                        className="comment-submit-btn"
                        onClick={() => handleAddComment(postId)}
                      >
                        {str.replyBtn}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
