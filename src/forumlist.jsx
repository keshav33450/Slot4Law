// ForumList.jsx
import React from "react";
import { db } from "./firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import ForumPost from "./ForumPost";

export default function ForumList() {
  const [posts, setPosts] = React.useState([]);
  const postsCol = collection(db, "posts");

  const loadPosts = async () => {
    // fetch posts
    const q = query(postsCol, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const items = await Promise.all(
      snap.docs.map(async (d) => {
        const data = { id: d.id, ...d.data() };
        // fetch replies subcollection if you want them together
        const repliesSnap = await getDocs(collection(db, "posts", d.id, "replies"));
        data.replies = repliesSnap.docs.map((r) => ({ id: r.id, ...r.data() }));
        return data;
      })
    );
    setPosts(items);
  };

  React.useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div>
      {posts.map((p) => (
        <ForumPost
          key={p.id}
          post={p}
          onPostUpdated={loadPosts}
          onPostDeleted={() => loadPosts()}
        />
      ))}
    </div>
  );
}
