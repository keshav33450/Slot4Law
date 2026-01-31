// src/LegalForum.jsx
import React, { useState, useEffect, useMemo } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./LegalForum.css";

import Reply from "./Reply";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const ALL_CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "criminal", label: "Criminal Law" },
  { id: "family", label: "Family Law" },
  { id: "property", label: "Property Law" },
  { id: "civil", label: "Civil Law" },
  { id: "consumer", label: "Consumer Rights" },
  { id: "employment", label: "Employment Law" },
];

export default function LegalForum() {
    const navigate = useNavigate();
  const [rawPosts, setRawPosts] = useState([]);
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
  const [currentUser, setCurrentUser] = useState(null);

  // Edit modal
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPostTitle, setEditingPostTitle] = useState("");
  const [editingPostContent, setEditingPostContent] = useState("");
  const [editingPostCategory, setEditingPostCategory] = useState("");

  // Track auth
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setCurrentUser(u));
  }, []);

  // Fetch posts
  useEffect(() => {
    const fetchAllPosts = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "forumPosts"));
        const posts = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setRawPosts(posts);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setErrorMsg("Failed to load posts.");
      }
      setLoading(false);
    };

    fetchAllPosts();
  }, []);

  const toJsDate = (ts) => {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate();
    if (typeof ts === "number") return new Date(ts);
    return new Date(ts);
  };

  // Sorting + filtering
  const posts = useMemo(() => {
    let list = [...rawPosts];

    if (selectedCategory !== "all") {
      list = list.filter(
        (p) =>
          (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "recent") {
      list.sort(
        (a, b) =>
          (toJsDate(b.createdAt)?.getTime() || 0) -
          (toJsDate(a.createdAt)?.getTime() || 0)
      );
    } else {
      list.sort((a, b) => {
        if ((b.votes || 0) !== (a.votes || 0))
          return (b.votes || 0) - (a.votes || 0);
        return (
          (toJsDate(b.createdAt)?.getTime() || 0) -
          (toJsDate(a.createdAt)?.getTime() || 0)
        );
      });
    }

    return list;
  }, [rawPosts, selectedCategory, sortBy]);

  // ✅ FIXED: Create Post — ALWAYS include currentUser.uid
  const handleCreatePost = async (e) => {
    e.preventDefault();

    const user = auth.currentUser; // fresh authentication
    if (!user) {
      alert("Please log in to post.");
      return;
    }

    console.log("Creating post as:", user.uid, user.email);

    const tagsArray = newPost.tags
      ? newPost.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    try {
      await addDoc(collection(db, "forumPosts"), {
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        author: user.displayName || newPost.author || "Anonymous",
        authorEmail: user.email || newPost.authorEmail || "",
        authorId: user.uid, // IMPORTANT
        votes: 0,
        replies: 0,
        createdAt: serverTimestamp(),
        tags: tagsArray,
      });

      const snap = await getDocs(collection(db, "forumPosts"));
      setRawPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

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
      alert("Failed to create post. Check console.");
    }
  };

  const handleVote = async (postId, type) => {
    try {
      await updateDoc(doc(db, "forumPosts", postId), {
        votes: increment(type === "upvote" ? 1 : -1),
      });

      setRawPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, votes: (p.votes || 0) + (type === "upvote" ? 1 : -1) }
            : p
        )
      );
    } catch (err) {
      console.error("Vote error:", err);
    }
  };

  const openPostDetails = async (post) => {
    setSelectedPost(post);
    try {
      const snap = await getDocs(
        collection(db, "forumPosts", post.id, "comments")
      );
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setComments([]);
    }
  };

  // ✅ FIXED: Add Comment — ALWAYS include currentUser.uid
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPost) return;

    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to reply.");
      return;
    }

    console.log("Comment as:", user.uid, user.email);

    try {
      await addDoc(
        collection(db, "forumPosts", selectedPost.id, "comments"),
        {
          content: newComment,
          author: user.displayName || "Anonymous",
          authorEmail: user.email || "",
          authorId: user.uid, // IMPORTANT
          votes: 0,
          createdAt: serverTimestamp(),
          isExpert: false,
        }
      );

      await updateDoc(doc(db, "forumPosts", selectedPost.id), {
        replies: increment(1),
      });

      await refreshPostAndComments(selectedPost);

      setNewComment("");
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  const handleEditPost = async (postId, updates) => {
    try {
      await updateDoc(doc(db, "forumPosts", postId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      const snap = await getDocs(collection(db, "forumPosts"));
      const updated = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRawPosts(updated);

      const found = updated.find((p) => p.id === postId);
      if (found) setSelectedPost(found);
    } catch (err) {
      console.error("Edit error:", err);
      alert("Unable to edit post.");
    }
  };

  const handleDeletePost = async (postId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Delete permanently?")) return;

    try {
      await deleteDoc(doc(db, "forumPosts", postId));

      const snap = await getDocs(collection(db, "forumPosts"));
      setRawPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

      if (selectedPost?.id === postId) setSelectedPost(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const refreshPostAndComments = async (post) => {
    const cSnap = await getDocs(
      collection(db, "forumPosts", post.id, "comments")
    );
    setComments(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    const pSnap = await getDocs(collection(db, "forumPosts"));
    const updated = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setRawPosts(updated);

    const sel = updated.find((p) => p.id === post.id);
    if (sel) setSelectedPost(sel);
  };

  const canEditOrDeletePost = (post) =>
    currentUser &&
    (currentUser.uid === post.authorId ||
      currentUser.email === post.authorEmail);

  const canEditSelectedPost =
    selectedPost &&
    currentUser &&
    (currentUser.uid === selectedPost.authorId ||
      currentUser.email === selectedPost.authorEmail);

  return (
    <div className="forum-page">
      <Navbar />

      <div className="forum-container">
        <div className="forum-header">
          <h1>Legal Community Forum</h1>
          <p>Ask questions, share experiences, and get advice</p>
         <div className="forum-header-actions">
  <div className="forum-header-actions">
  <button
  className="btn-secondary"
  onClick={() => {
    if (!currentUser) {
      alert("Please login to view your questions");
      return;
    }
navigate("/previous-questions");
  }}
>
  My Questions
</button>
 <button className="btn-new-post" onClick={() => setShowNewPostModal(true)} > + Ask a Question </button>
</div>
</div>

        </div>

        {/* CATEGORY & SORT */}
        <div className="forum-controls">
          <div className="category-tabs">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`tab ${
                  selectedCategory === cat.id ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* POSTS */}
        <div className="posts-list">
          {loading && <div className="loading">Loading…</div>}

          {!loading && posts.length === 0 && (
            <div className="empty-state">No posts found.</div>
          )}

          {posts.map((post) => {
            const createdAt = toJsDate(post.createdAt);

            return (
              <div
                key={post.id}
                className="post-card"
                onClick={() => openPostDetails(post)}
              >
                <div className="post-votes">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(post.id, "upvote");
                    }}
                  >
                    <ThumbsUp size={18} />
                  </button>

                  <span className="vote-count">{post.votes || 0}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(post.id, "downvote");
                    }}
                  >
                    <ThumbsDown size={18} />
                  </button>
                </div>

                <div className="post-content">
                  <h3>{post.title}</h3>
                  <p>
                    {post.content?.length > 150
                      ? post.content.substring(0, 150) + "..."
                      : post.content}
                  </p>

                  <div className="post-meta">
                    <span className="category-badge">{post.category}</span>
                    <span className="author">by {post.author}</span>
                    <span className="time">
                      {createdAt ? createdAt.toLocaleDateString() : "—"}
                    </span>
                    <span className="replies">
                      <MessageCircle size={14} /> {post.replies || 0} replies
                    </span>
                  </div>

                  {post.tags?.length > 0 && (
                    <div className="post-tags">
                      {post.tags.map((tag, i) => (
                        <span className="tag" key={i}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {canEditOrDeletePost(post) && (
                    <div
                      className="post-owner-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="btn-small"
                        onClick={() => {
                          openPostDetails(post);
                          setIsEditingPost(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-small btn-danger"
                        onClick={(e) => handleDeletePost(post.id, e)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CREATE POST MODAL */}
        {showNewPostModal && (
          <div className="modal-overlay" onClick={() => setShowNewPostModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Ask a Legal Question</h2>
              <form onSubmit={handleCreatePost}>
                <input
                  type="text"
                  placeholder="Title"
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                  required
                />

                <textarea
                  placeholder="Describe your question..."
                  rows="6"
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                  required
                />

                <select
                  value={newPost.category}
                  onChange={(e) =>
                    setNewPost({ ...newPost, category: e.target.value })
                  }
                >
                  <option value="criminal">Criminal Law</option>
                  <option value="family">Family Law</option>
                  <option value="property">Property Law</option>
                  <option value="civil">Civil Law</option>
                  <option value="consumer">Consumer Rights</option>
                  <option value="employment">Employment Law</option>
                </select>

                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={newPost.author}
                  onChange={(e) =>
                    setNewPost({ ...newPost, author: e.target.value })
                  }
                />

                <input
                  type="email"
                  placeholder="Your email (optional)"
                  value={newPost.authorEmail}
                  onChange={(e) =>
                    setNewPost({ ...newPost, authorEmail: e.target.value })
                  }
                />

                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={newPost.tags}
                  onChange={(e) =>
                    setNewPost({ ...newPost, tags: e.target.value })
                  }
                />

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowNewPostModal(false)}>
                    Cancel
                  </button>
                  <button type="submit">Post Question</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* POST DETAILS MODAL */}
        {selectedPost && (
          <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
            <div
              className="modal-content post-details"
              onClick={(e) => e.stopPropagation()}
            >
              {isEditingPost ? (
                <>
                  <h2>Edit Post</h2>
                  <input
                    value={editingPostTitle}
                    onChange={(e) => setEditingPostTitle(e.target.value)}
                  />
                  <textarea
                    value={editingPostContent}
                    onChange={(e) => setEditingPostContent(e.target.value)}
                    rows="6"
                  />
                  <select
                    value={editingPostCategory}
                    onChange={(e) => setEditingPostCategory(e.target.value)}
                  >
                    <option value="criminal">Criminal Law</option>
                    <option value="family">Family Law</option>
                    <option value="property">Property Law</option>
                    <option value="civil">Civil Law</option>
                    <option value="consumer">Consumer Rights</option>
                    <option value="employment">Employment Law</option>
                  </select>

                  <div className="modal-actions">
                    <button onClick={() => setIsEditingPost(false)}>
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        const user = auth.currentUser;

                        if (
                          !user ||
                          (selectedPost.authorId !== user.uid &&
                            selectedPost.authorEmail !== user.email)
                        ) {
                          alert("You cannot edit this post.");
                          return;
                        }

                        await handleEditPost(selectedPost.id, {
                          title: editingPostTitle,
                          content: editingPostContent,
                          category: editingPostCategory,
                        });
                        setIsEditingPost(false);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2>{selectedPost.title}</h2>

                  {canEditSelectedPost && (
                    <div className="modal-post-owner-actions">
                      <button
                        className="btn-small"
                        onClick={() => setIsEditingPost(true)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-small btn-danger"
                        onClick={async () => {
                          if (!window.confirm("Delete permanently?")) return;
                          await handleDeletePost(selectedPost.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  <div className="post-meta" style={{ marginTop: 8 }}>
                    <span className="category-badge">
                      {selectedPost.category}
                    </span>
                    <span className="author">by {selectedPost.author}</span>
                    <span className="time">
                      {selectedPost.createdAt
                        ? toJsDate(selectedPost.createdAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>

                  <p className="post-full-content">{selectedPost.content}</p>

                  <div className="comments-section">
                    <h3>{comments.length} Replies</h3>

                    <form onSubmit={handleAddComment} className="comment-form">
                      <textarea
                        placeholder="Write your answer..."
                        rows="3"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <button type="submit">
                        <Send size={16} /> Reply
                      </button>
                    </form>

                    <div className="comments-list">
                      {comments.map((c) => (
                        <Reply
                          key={c.id}
                          reply={c}
                          postId={selectedPost.id}
                          currentUser={currentUser}
                          onReplyUpdated={() =>
                            refreshPostAndComments(selectedPost)
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="modal-actions" style={{ marginTop: 12 }}>
                    <button onClick={() => setSelectedPost(null)}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

