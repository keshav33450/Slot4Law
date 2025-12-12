// ForumPost.jsx
import React, { useState } from "react";
import { auth, db } from "./firebase"; // your firebase exports
import {
  doc,
  deleteDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ForumPost({ post, onPostUpdated, onPostDeleted }) {
  // post shape assumed: { id, title, body, authorId, authorName, createdAt, replies: [ {id, text, authorId, authorName, createdAt} ] }
  const [currentUser, setCurrentUser] = React.useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body);
  const [replyText, setReplyText] = useState("");

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  const canEditOrDelete = currentUser && currentUser.uid === post.authorId;

  // Update post
  const handleSaveEdit = async () => {
    const postRef = doc(db, "posts", post.id);
    await updateDoc(postRef, {
      title: editTitle,
      body: editBody,
      updatedAt: serverTimestamp(),
    });
    setIsEditing(false);
    onPostUpdated?.(); // parent refresh
  };

  // Delete post
  const handleDelete = async () => {
    // optional: show a nicer confirm UI instead of alert
    if (!window.confirm("Delete this post permanently?")) return;
    const postRef = doc(db, "posts", post.id);
    await deleteDoc(postRef);
    onPostDeleted?.(post.id);
  };

  // Add reply (any signed-in user)
  const handleAddReply = async () => {
    if (!currentUser) {
      alert("Please login to reply.");
      return;
    }
    if (!replyText.trim()) return;
    const repliesCol = collection(db, "posts", post.id, "replies");
    await addDoc(repliesCol, {
      text: replyText,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || "Anonymous",
      createdAt: serverTimestamp(),
    });
    setReplyText("");
    onPostUpdated?.(); // parent refresh to show reply
  };

  // Reply delete/edit are handled in Reply component (below)
  return (
    <div className="forum-post-card">
      {isEditing ? (
        <div className="edit-area">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} />
          <button onClick={handleSaveEdit}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <div className="meta">
            <small>by {post.authorName}</small>
            <small>{post.createdAt?.toDate?.().toLocaleString?.()}</small>
          </div>

          <div className="post-actions">
            {canEditOrDelete && (
              <>
                <button onClick={() => setIsEditing(true)}>Edit</button>
                <button onClick={handleDelete}>Delete</button>
              </>
            )}
          </div>

          <div className="replies">
            {post.replies?.map((r) => (
              <Reply
                key={r.id}
                reply={r}
                postId={post.id}
                currentUser={currentUser}
                onReplyUpdated={onPostUpdated}
              />
            ))}
          </div>

          <div className="reply-form">
            <textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button onClick={handleAddReply}>Reply</button>
          </div>
        </>
      )}
    </div>
  );
}
