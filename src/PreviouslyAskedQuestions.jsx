import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { db } from "./firebase";
import Navbar from "./Navbar";
import { MessageCircle } from "lucide-react";
import "./PreviouslyAskedQuestions.css";

export default function PreviouslyAskedQuestions() {
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyQuestions = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setLoading(true);

      try {
        const q = query(
          collection(db, "forumPosts"),
          where("authorId", "==", user.uid)
        );

        const snap = await getDocs(q);
        setMyPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to fetch user questions:", err);
      }

      setLoading(false);
    };

    fetchMyQuestions();
  }, []);

  return (
    <div className="forum-page">
      <Navbar />

      <div className="forum-container">
        {/* Header */}
        <div className="forum-header">
          <h1>My Questions</h1>
          <p>Questions you have asked</p>
        </div>

        {/* Loading */}
        {loading && <div className="loading">Loading…</div>}

        {/* Empty State */}
        {!loading && myPosts.length === 0 && (
          <div className="empty-state">
            You haven’t asked any questions yet.
          </div>
        )}

        {/* Questions List */}
        <div className="posts-list">
          {myPosts.map((post) => (
            <div
              key={post.id}
              className="post-card"
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate(`/legal-forum?postId=${post.id}`)
              }
            >
              <div className="post-content">
                {/* Title */}
                <h3>{post.title}</h3>

                {/* Description */}
                <p className="post-desc">
                  {post.content}
                </p>

                {/* Meta info */}
                <div className="post-meta">
                  <span className="category-badge">
                    {post.category}
                  </span>

                  <span className="author">
                    Asked by <strong>{post.author}</strong>
                  </span>

                  {post.authorEmail && (
                    <span className="email">
                      Email: {post.authorEmail}
                    </span>
                  )}

                  <span className="time">
                    Posted on{" "}
                    {post.createdAt?.toDate().toLocaleDateString()}
                  </span>

                  <span className="replies">
                    <MessageCircle size={14} />{" "}
                    {post.replies || 0} replies
                  </span>
                </div>

                {/* Tags */}
                {post.tags?.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag, i) => (
                      <span className="tag" key={i}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Back */}
        <div style={{ marginTop: 20 }}>
          <button
  className="btn-back"
  onClick={() => navigate("/legal-forum")}
>
  ← Back to Forum
</button>

        </div>
      </div>
    </div>
  );
}
