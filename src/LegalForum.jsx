// src/LegalForum.jsx
import React, { useState, useEffect, useMemo } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, Send } from "lucide-react";
import Navbar from "./Navbar";
import "./LegalForum.css";

import Reply from "./reply";

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

  // post edit modal state
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPostTitle, setEditingPostTitle] = useState("");
  const [editingPostContent, setEditingPostContent] = useState("");
  const [editingPostCategory, setEditingPostCategory] = useState("");

  // track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // fetch all posts on mount
  useEffect(() => {
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
            authorId: data.authorId ?? null,
            votes: typeof data.votes === "number" ? data.votes : 0,
            replies: typeof data.replies === "number" ? data.replies : 0,
            createdAt: data.createdAt ?? null,
            tags: Array.isArray(data.tags) ? data.tags : [],
            ...data,
          };
        });
        setRawPosts(postsData);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setErrorMsg("Failed to load posts from Firestore.");
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

  // Client-side filtered & sorted posts
  const posts = useMemo(() => {
    let list = [...rawPosts];

    if (selectedCategory && selectedCategory !== "all") {
      list = list.filter((p) => {
        const pCat = (p.category || "").toString().trim().toLowerCase();
        return pCat === selectedCategory.toString().trim().toLowerCase();
      });
    }

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

  // Create a new post (requires auth)
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to post.");
      return;
    }
    try {
      const tagsArray = newPost.tags ? newPost.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      const authorName = currentUser?.displayName || newPost.author || "Anonymous";
      const authorEmail = currentUser?.email || newPost.authorEmail || "";
      const authorId = currentUser?.uid || null;

      await addDoc(collection(db, "forumPosts"), {
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        author: authorName,
        authorEmail,
        authorId,
        votes: 0,
        replies: 0,
        createdAt: serverTimestamp(),
        tags: tagsArray,
      });

      // refresh posts list
      const pSnap = await getDocs(collection(db, "forumPosts"));
      setRawPosts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      setShowNewPostModal(false);
      setNewPost({ title: "", content: "", category: "criminal", author: "", authorEmail: "", tags: "" });
      alert("Post created!");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post. See console.");
    }
  };

  // Upvote/Downvote
  const handleVote = async (postId, type) => {
    try {
      const postRef = doc(db, "forumPosts", postId);
      await updateDoc(postRef, {
        votes: increment(type === "upvote" ? 1 : -1),
      });

      // optimistic local update
      setRawPosts((prev) => prev.map(p => p.id === postId ? { ...p, votes: (p.votes || 0) + (type === "upvote" ? 1 : -1) } : p));
    } catch (err) {
      console.error("Vote error:", err);
    }
  };

  // Open post details + fetch comments
  const openPostDetails = async (post) => {
    setSelectedPost(post);
    try {
      const commentsRef = collection(db, "forumPosts", post.id, "comments");
      const snap = await getDocs(commentsRef);
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Fetch comments error:", err);
      setComments([]);
    }
  };

  // Add comment (reply)
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPost) return;
    if (!currentUser) {
      alert("Please log in to reply.");
      return;
    }
    try {
      const authorName = currentUser?.displayName || "Anonymous";
      const authorEmail = currentUser?.email || "";
      const authorId = currentUser?.uid || null;

      await addDoc(collection(db, "forumPosts", selectedPost.id, "comments"), {
        content: newComment,
        author: authorName,
        authorEmail,
        authorId,
        votes: 0,
        createdAt: serverTimestamp(),
        isExpert: false,
      });

      // increment reply count
      await updateDoc(doc(db, "forumPosts", selectedPost.id), { replies: increment(1) });

      // refresh comments and posts
      await refreshPostAndComments(selectedPost);

      setNewComment("");
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  // Edit post
  const handleEditPost = async (postId, updates) => {
    try {
      await updateDoc(doc(db, "forumPosts", postId), { ...updates, updatedAt: serverTimestamp() });

      // refresh posts and selectedPost
      const pSnap = await getDocs(collection(db, "forumPosts"));
      const updatedPosts = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRawPosts(updatedPosts);
      const updated = updatedPosts.find((p) => p.id === postId);
      if (updated) setSelectedPost(updated);
    } catch (err) {
      console.error("Edit post error:", err);
      alert("Unable to edit post. See console.");
    }
  };

  // Delete post
  const handleDeletePost = async (postId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await deleteDoc(doc(db, "forumPosts", postId));
      const pSnap = await getDocs(collection(db, "forumPosts"));
      setRawPosts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      if (selectedPost?.id === postId) setSelectedPost(null);
    } catch (err) {
      console.error("Delete post error:", err);
      alert("Could not delete post. See console.");
    }
  };

  // Refresh both comments and posts after reply edit/delete
  const refreshPostAndComments = async (post) => {
    try {
      const cSnap = await getDocs(collection(db, "forumPosts", post.id, "comments"));
      setComments(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const pSnap = await getDocs(collection(db, "forumPosts"));
      const updatedPosts = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRawPosts(updatedPosts);

      const updated = updatedPosts.find((p) => p.id === post.id);
      if (updated) setSelectedPost(updated);
    } catch (err) {
      console.error("Error refreshing post/comments:", err);
    }
  };

  // sync modal edit fields when selectedPost changes
  useEffect(() => {
    if (selectedPost) {
      setIsEditingPost(false);
      setEditingPostTitle(selectedPost.title || "");
      setEditingPostContent(selectedPost.content || "");
      setEditingPostCategory(selectedPost.category || "criminal");
    }
  }, [selectedPost]);

  // computed ownership checks
  const canEditOrDeletePost = (post) =>
    currentUser &&
    ((post.authorEmail && currentUser.email && currentUser.email === post.authorEmail) ||
      (post.authorId && currentUser.uid && currentUser.uid === post.authorId));

  const canEditSelectedPost =
    selectedPost &&
    currentUser &&
    ((selectedPost.authorEmail && currentUser.email && currentUser.email === selectedPost.authorEmail) ||
      (selectedPost.authorId && currentUser.uid && currentUser.uid === selectedPost.authorId));

  const storedCategories = useMemo(() => {
    const setCats = new Set(rawPosts.map((p) => (p.category || "").toString().trim().toLowerCase()));
    return Array.from(setCats);
  }, [rawPosts]);

  return (
    <div className="forum-page">
      <Navbar />

      <div className="forum-container">
        <div className="forum-header">
          <h1>Legal Community Forum</h1>
          <p>Ask questions, share experiences, and get advice from the community</p>
          <button className="btn-new-post" onClick={() => setShowNewPostModal(true)}>+ Ask a Question</button>
        </div>

        <div className="forum-controls">
          <div className="category-tabs">
            {ALL_CATEGORIES.map((cat) => (
              <button key={cat.id} className={`tab ${selectedCategory === cat.id ? "active" : ""}`} onClick={() => setSelectedCategory(cat.id)}>{cat.label}</button>
            ))}
          </div>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {errorMsg && <div className="error-msg">{errorMsg}</div>}

        <div style={{ marginTop: 8, marginBottom: 8, color: "#666", fontSize: 13 }}>
          Stored categories in DB: {storedCategories.length ? storedCategories.join(", ") : "none"}
        </div>

        <div className="posts-list">
          {loading && <div className="loading">Loading posts…</div>}

          {!loading && posts.length === 0 && <div className="empty-state">No posts found for this filter.</div>}

          {posts.map((post) => {
            const createdAtDate = toJsDate(post.createdAt);
            const trimmedContent = post.content && post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content || "";

            return (
              <div key={post.id} className="post-card" onClick={() => openPostDetails(post)}>
                <div className="post-votes">
                  <button onClick={(e) => { e.stopPropagation(); handleVote(post.id, "upvote"); }}><ThumbsUp size={18} /></button>
                  <span className="vote-count">{post.votes ?? 0}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleVote(post.id, "downvote"); }}><ThumbsDown size={18} /></button>
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
                    <div className="post-tags">{post.tags.map((tag, idx) => <span key={idx} className="tag">#{tag}</span>)}</div>
                  )}

                  {canEditOrDeletePost(post) && (
                    <div className="post-owner-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-small" onClick={() => { openPostDetails(post); setIsEditingPost(true); }}>Edit</button>
                      <button className="btn-small btn-danger" onClick={(e) => handleDeletePost(post.id, e)}>Delete</button>
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
                <input type="text" placeholder="Title" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} required />
                <textarea placeholder="Describe your question..." value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} rows="6" required />
                <select value={newPost.category} onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}>
                  <option value="criminal">Criminal Law</option>
                  <option value="family">Family Law</option>
                  <option value="property">Property Law</option>
                  <option value="civil">Civil Law</option>
                  <option value="consumer">Consumer Rights</option>
                  <option value="employment">Employment Law</option>
                </select>
                <input type="text" placeholder="Your name (optional)" value={newPost.author} onChange={(e) => setNewPost({ ...newPost, author: e.target.value })} />
                <input type="email" placeholder="Your email (optional)" value={newPost.authorEmail} onChange={(e) => setNewPost({ ...newPost, authorEmail: e.target.value })} />
                <input type="text" placeholder="Tags (comma-separated)" value={newPost.tags} onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })} />
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
              {isEditingPost ? (
                <>
                  <h2>Edit Post</h2>
                  <input value={editingPostTitle} onChange={(e) => setEditingPostTitle(e.target.value)} />
                  <textarea value={editingPostContent} onChange={(e) => setEditingPostContent(e.target.value)} rows="6" />
                  <select value={editingPostCategory} onChange={(e) => setEditingPostCategory(e.target.value)}>
                    <option value="criminal">Criminal Law</option>
                    <option value="family">Family Law</option>
                    <option value="property">Property Law</option>
                    <option value="civil">Civil Law</option>
                    <option value="consumer">Consumer Rights</option>
                    <option value="employment">Employment Law</option>
                  </select>
                  <div className="modal-actions">
                    <button onClick={() => setIsEditingPost(false)}>Cancel</button>
                    <button onClick={async () => {
                      const canEdit =
                        currentUser &&
                        ((selectedPost.authorEmail && currentUser.email === selectedPost.authorEmail) ||
                          (selectedPost.authorId && currentUser.uid === selectedPost.authorId));
                      if (!canEdit) {
                        alert("You are not allowed to edit this post.");
                        return;
                      }
                      await handleEditPost(selectedPost.id, {
                        title: editingPostTitle,
                        content: editingPostContent,
                        category: editingPostCategory,
                      });
                      setIsEditingPost(false);
                    }}>Save</button>
                  </div>
                </>
              ) : (
                <>
                  <h2>{selectedPost.title}</h2>

                  {canEditSelectedPost && (
                    <div className="modal-post-owner-actions" style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button className="btn-small" onClick={(e) => { e.stopPropagation(); setIsEditingPost(true); }}>Edit Post</button>
                      <button className="btn-small btn-danger" onClick={async (e) => { e.stopPropagation(); if (!window.confirm("Delete this post permanently?")) return; await handleDeletePost(selectedPost.id, e); }}>Delete Post</button>
                    </div>
                  )}

                  <div className="post-meta" style={{ marginTop: 8 }}>
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
                      {comments.map((c) => (
                        <Reply
                          key={c.id}
                          reply={c}
                          postId={selectedPost.id}
                          currentUser={currentUser}
                          onReplyUpdated={() => refreshPostAndComments(selectedPost)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="modal-actions" style={{ marginTop: 12 }}>
                    <button className="close-modal" onClick={() => setSelectedPost(null)}>Close</button>
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
