// src/LegalForum.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Award,
} from "lucide-react";
import Navbar from "./Navbar";
import "./LegalForum.css";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const ALL_CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "criminal", label: "Criminal Law" },
  { id: "family", label: "Family Law" },
  { id: "property", label: "Property Law" },
  { id: "civil", label: "Civil Law" },
  { id: "consumer", label: "Consumer Rights" },
  { id: "employment", label: "Employment Law" },
];

const LegalForum = () => {
  const [rawPosts, setRawPosts] = useState([]); // all posts from Firestore
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "criminal",
    author: "",
    authorEmail: "",
    tags: "",
  });

  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    // Fetch all posts once and store locally (client-side filtering)
    const fetchAllPosts = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const postsRef = collection(db, "forumPosts");
        const snap = await getDocs(postsRef);
        const postsData = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || "",
            content: data.content || "",
            category: data.category || "uncategorized",
            author: data.author || "Anonymous",
            authorEmail: data.authorEmail || "",
            votes: typeof data.votes === "number" ? data.votes : 0,
            replies: typeof data.replies === "number" ? data.replies : 0,
            createdAt: data.createdAt ?? null,
            tags: Array.isArray(data.tags) ? data.tags : [],
            ...data,
          };
        });

        setRawPosts(postsData);
        console.debug("Fetched posts count:", postsData.length);
      } catch (err) {
        console.error("Error fetching all posts:", err);
        setErrorMsg("Failed to load posts from Firestore. See console for details.");
        setRawPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPosts();
  }, []);

  // Helper to convert Firestore timestamp/Date/string -> Date
  const toJsDate = (ts) => {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate();
    if (typeof ts === "number") return new Date(ts);
    return new Date(ts);
  };

  // Client-side filtered & sorted posts (recomputed when inputs change)
  const posts = useMemo(() => {
    let list = [...rawPosts];

    // Filter by category (client-side)
    if (selectedCategory && selectedCategory !== "all") {
      // Normalize both values to lowercase trimmed for safer matching
      list = list.filter((p) => {
        const pCat = (p.category || "").toString().trim().toLowerCase();
        return pCat === selectedCategory.toString().trim().toLowerCase();
      });
    }

    // Sort: 'recent' by createdAt desc, 'popular' by votes desc then createdAt
    if (sortBy === "recent") {
      list.sort((a, b) => {
        const da = toJsDate(a.createdAt)?.getTime() || 0;
        const db = toJsDate(b.createdAt)?.getTime() || 0;
        return db - da;
      });
    } else if (sortBy === "popular") {
      list.sort((a, b) => {
        if ((b.votes || 0) !== (a.votes || 0)) return (b.votes || 0) - (a.votes || 0);
        const da = toJsDate(a.createdAt)?.getTime() || 0;
        const db = toJsDate(b.createdAt)?.getTime() || 0;
        return db - da;
      });
    }

    return list;
  }, [rawPosts, selectedCategory, sortBy]);

  // Create a new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = newPost.tags
        ? newPost.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      await addDoc(collection(db, "forumPosts"), {
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        author: newPost.author || "Anonymous",
        authorEmail: newPost.authorEmail || "",
        votes: 0,
        replies: 0,
        createdAt: serverTimestamp(),
        tags: tagsArray,
      });

      // After creating, re-fetch all posts (could be optimized)
      const postsRef = collection(db, "forumPosts");
      const snap = await getDocs(postsRef);
      const postsData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRawPosts(postsData);

      setShowNewPostModal(false);
      setNewPost({
        title: "",
        content: "",
        category: "criminal",
        author: "",
        authorEmail: "",
        tags: "",
      });
      alert("Post created!");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post. See console for details.");
    }
  };

  // Upvote/Downvote (server-side)
  const handleVote = async (postId, type) => {
    try {
      const postRef = doc(db, "forumPosts", postId);
      await updateDoc(postRef, {
        votes: increment(type === "upvote" ? 1 : -1),
      });

      // update local copy quickly (optimistic)
      setRawPosts((prev) => prev.map(p => p.id === postId ? {...p, votes: (p.votes||0) + (type==='upvote'?1:-1)} : p));
    } catch (err) {
      console.error("Vote error:", err);
    }
  };

  // Open post details + fetch comments (simple getDocs)
  const openPostDetails = async (post) => {
    setSelectedPost(post);
    try {
      const commentsRef = collection(db, "forumPosts", post.id, "comments");
      const snap = await getDocs(commentsRef);
      const commentsData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(commentsData);
    } catch (err) {
      console.error("Fetch comments error:", err);
      setComments([]);
    }
  };

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPost) return;
    try {
      const commentsRef = collection(db, "forumPosts", selectedPost.id, "comments");
      const docRef = await addDoc(commentsRef, {
        content: newComment,
        author: "Current User",
        authorEmail: "user@example.com",
        votes: 0,
        createdAt: serverTimestamp(),
        isExpert: false,
      });

      // update reply count on post
      const postRef = doc(db, "forumPosts", selectedPost.id);
      await updateDoc(postRef, { replies: increment(1) });

      // refresh comments and posts list (simple re-fetch)
      const snap = await getDocs(collection(db, "forumPosts", selectedPost.id, "comments"));
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Refresh all posts to pick up reply count change
      const postsSnap = await getDocs(collection(db, "forumPosts"));
      setRawPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      setNewComment("");
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  const formatDateForDisplay = (createdAt) => {
    const d = toJsDate(createdAt);
    if (!d || isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  };

  // --- helpful debug UI message about categories mismatch ---
  const storedCategories = useMemo(() => {
    const setCats = new Set(rawPosts.map(p => (p.category || "").toString().trim().toLowerCase()));
    return Array.from(setCats);
  }, [rawPosts]);

  return (
    <div className="forum-page">
      <Navbar />

      <div className="forum-container">
        <div className="forum-header">
          <h1>Legal Community Forum</h1>
          <p>Ask questions, share experiences, and get advice from the community</p>
          <button className="btn-new-post" onClick={() => setShowNewPostModal(true)}>
            + Ask a Question
          </button>
        </div>

        <div className="forum-controls">
          <div className="category-tabs">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`tab ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {errorMsg && <div className="error-msg">{errorMsg}</div>}

        <div style={{ marginTop: 8, marginBottom: 8, color: "#666", fontSize: 13 }}>
          {/* Debug hint: show categories present in DB so you can verify exact strings */}
          Stored categories in DB: {storedCategories.length ? storedCategories.join(", ") : "none"}
        </div>

        <div className="posts-list">
          {loading && <div className="loading">Loading posts…</div>}

          {!loading && posts.length === 0 && (
            <div className="empty-state">
              No posts found for this filter.
            </div>
          )}

          {posts.map((post) => {
            const createdAtDate = toJsDate(post.createdAt);
            const trimmedContent =
              post.content && post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content || "";

            return (
              <div key={post.id} className="post-card" onClick={() => openPostDetails(post)}>
                <div className="post-votes">
                  <button onClick={(e) => { e.stopPropagation(); handleVote(post.id, "upvote"); }}>
                    <ThumbsUp size={18} />
                  </button>
                  <span className="vote-count">{post.votes ?? 0}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleVote(post.id, "downvote"); }}>
                    <ThumbsDown size={18} />
                  </button>
                </div>

                <div className="post-content">
                  <h3>{post.title}</h3>
                  <p>{trimmedContent}</p>

                  <div className="post-meta">
                    <span className="category-badge">{post.category}</span>
                    <span className="author">by {post.author}</span>
                    <span className="time">{createdAtDate ? createdAtDate.toLocaleDateString() : "—"}</span>
                    <span className="replies"><MessageCircle size={14} /> {post.replies ?? 0} replies</span>
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className="post-tags">
                      {post.tags.map((tag, idx) => <span key={idx} className="tag">#{tag}</span>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* New Post Modal */}
        {showNewPostModal && (
          <div className="modal-overlay" onClick={() => setShowNewPostModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Ask a Legal Question</h2>
              <form onSubmit={handleCreatePost}>
                <input type="text" placeholder="Title of your question" value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} required />

                <textarea placeholder="Describe your legal question in detail..."
                  value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} rows="6" required />

                <select value={newPost.category} onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}>
                  <option value="criminal">Criminal Law</option>
                  <option value="family">Family Law</option>
                  <option value="property">Property Law</option>
                  <option value="civil">Civil Law</option>
                  <option value="consumer">Consumer Rights</option>
                  <option value="employment">Employment Law</option>
                </select>

                <input type="text" placeholder="Your name (optional)" value={newPost.author}
                  onChange={(e) => setNewPost({ ...newPost, author: e.target.value })} />

                <input type="email" placeholder="Your email (optional)" value={newPost.authorEmail}
                  onChange={(e) => setNewPost({ ...newPost, authorEmail: e.target.value })} />

                <input type="text" placeholder="Tags (comma-separated)" value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })} />

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowNewPostModal(false)}>Cancel</button>
                  <button type="submit">Post Question</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Post Details Modal */}
        {selectedPost && (
          <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
            <div className="modal-content post-details" onClick={(e) => e.stopPropagation()}>
              <h2>{selectedPost.title}</h2>
              <div className="post-meta">
                <span className="category-badge">{selectedPost.category}</span>
                <span className="author">by {selectedPost.author}</span>
                <span className="time">{selectedPost.createdAt ? toJsDate(selectedPost.createdAt).toLocaleString() : "—"}</span>
              </div>

              <p className="post-full-content">{selectedPost.content}</p>

              <div className="comments-section">
                <h3>{comments.length} Replies</h3>

                <form onSubmit={handleAddComment} className="comment-form">
                  <textarea placeholder="Write your answer..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows="3" />
                  <button type="submit"><Send size={16} /> Post Reply</button>
                </form>

                <div className="comments-list">
                  {comments.map((comment) => {
                    const commentDate = toJsDate(comment.createdAt);
                    return (
                      <div key={comment.id} className="comment">
                        <div className="comment-header">
                          <span className="comment-author">
                            {comment.author}{comment.isExpert && <Award size={14} className="expert-badge" title="Verified Expert" />}
                          </span>
                          <span className="comment-time">{commentDate ? commentDate.toLocaleDateString() : "—"}</span>
                        </div>
                        <p>{comment.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button className="close-modal" onClick={() => setSelectedPost(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalForum;
