// src/Reply.jsx
import React from "react";
import { doc, updateDoc, deleteDoc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

export default function Reply({ reply, postId, currentUser, onReplyUpdated }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(reply.content ?? reply.text ?? "");

  // ownership by authorEmail or authorId (uid)
  const isOwner =
    currentUser &&
    ((reply.authorEmail && currentUser.email && currentUser.email === reply.authorEmail) ||
      (reply.authorId && currentUser.uid && currentUser.uid === reply.authorId));

  const createdAtText = (() => {
    const ts = reply.createdAt;
    if (!ts) return "";
    if (ts.toDate) return ts.toDate().toLocaleString();
    if (typeof ts === "object" && ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return new Date(ts).toLocaleString();
  })();

  const handleSave = async (e) => {
    e?.stopPropagation?.();
    if (!editText.trim()) return;
    try {
      const replyRef = doc(db, "forumPosts", postId, "comments", reply.id);
      await updateDoc(replyRef, { content: editText, updatedAt: new Date() });
      setIsEditing(false);
      onReplyUpdated?.();
    } catch (err) {
      console.error("Failed to edit reply:", err);
      alert("Could not save reply. See console.");
    }
  };

  const handleDelete = async (e) => {
    e?.stopPropagation?.();
    if (!window.confirm("Delete this reply?")) return;

    const postRef = doc(db, "forumPosts", postId);
    const replyRef = doc(db, "forumPosts", postId, "comments", reply.id);

    try {
      await runTransaction(db, async (transaction) => {
        const postSnap = await transaction.get(postRef);
        if (!postSnap.exists()) {
          throw new Error("Post does not exist");
        }

        // delete the reply
        transaction.delete(replyRef);

        // decrement replies count safely (no negative counts)
        const currentReplies = postSnap.data().replies ?? 0;
        const newReplies = Math.max(0, currentReplies - 1);
        transaction.update(postRef, { replies: newReplies });
      });

      // notify parent to refresh UI (parent should re-fetch comments and posts)
      onReplyUpdated?.();
    } catch (err) {
      console.error("Failed to delete reply (transaction):", err);
      alert("Could not delete reply. See console.");
    }
  };

  return (
    <div className="comment" onClick={(e) => e.stopPropagation()}>
      <div className="comment-header">
        <span className="comment-author">{reply.author ?? reply.authorName ?? "Anonymous"}</span>
        <span className="comment-time">{createdAtText || "—"}</span>
      </div>

      {isEditing ? (
        <>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            placeholder="Edit reply..."
          />
          <div className="comment-actions">
            <button onClick={() => { setIsEditing(false); setEditText(reply.content ?? reply.text ?? ""); }}>Cancel</button>
            <button onClick={handleSave}>Save</button>
          </div>
        </>
      ) : (
        <>
          <p>{reply.content ?? reply.text}</p>

          {isOwner && (
            <div className="comment-owner-actions">
              <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>Edit</button>
              <button onClick={handleDelete}>Delete</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
