import express from 'express';

// In-memory storage (later replace with MongoDB/database)
let posts = [
  {
    id: 1,
    title: "What are my rights if arrested without a warrant?",
    content: "I was detained by police without showing any warrant. Is this legal in India?",
    category: "criminal",
    author: "Anonymous",
    authorEmail: "user@example.com",
    votes: 15,
    replies: 3,
    createdAt: new Date("2025-12-08T10:00:00"),
    tags: ["arrest", "rights", "police"]
  },
  {
    id: 2,
    title: "How to register a property in Maharashtra?",
    content: "What documents are needed for property registration? What are the stamp duty charges?",
    category: "property",
    author: "John Doe",
    authorEmail: "john@example.com",
    votes: 8,
    replies: 2,
    createdAt: new Date("2025-12-07T14:30:00"),
    tags: ["property", "registration", "maharashtra"]
  }
];

let comments = [
  {
    id: 1,
    postId: 1,
    content: "Under Article 22 of the Indian Constitution, you have the right to know the grounds of arrest. Police must inform you of charges and produce you before a magistrate within 24 hours.",
    author: "Advocate Kumar",
    authorEmail: "kumar@lawyer.com",
    votes: 10,
    createdAt: new Date("2025-12-08T11:00:00"),
    isExpert: true
  }
];

// Get all posts
export const getPosts = (req, res) => {
  const { category, sortBy = 'recent' } = req.query;
  
  let filteredPosts = posts;
  
  // Filter by category
  if (category && category !== 'all') {
    filteredPosts = posts.filter(post => post.category === category);
  }
  
  // Sort
  if (sortBy === 'recent') {
    filteredPosts.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sortBy === 'popular') {
    filteredPosts.sort((a, b) => b.votes - a.votes);
  }
  
  res.json({ success: true, posts: filteredPosts });
};

// Create new post
export const createPost = (req, res) => {
  const { title, content, category, author, authorEmail, tags } = req.body;
  
  if (!title || !content || !category) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  const newPost = {
    id: posts.length + 1,
    title,
    content,
    category,
    author: author || 'Anonymous',
    authorEmail,
    votes: 0,
    replies: 0,
    createdAt: new Date(),
    tags: tags || []
  };
  
  posts.unshift(newPost);
  
  res.json({ success: true, post: newPost });
};

// Vote on post
export const votePost = (req, res) => {
  const { id } = req.params;
  const { type } = req.body; // 'upvote' or 'downvote'
  
  const post = posts.find(p => p.id === parseInt(id));
  
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }
  
  if (type === 'upvote') {
    post.votes += 1;
  } else if (type === 'downvote') {
    post.votes -= 1;
  }
  
  res.json({ success: true, post });
};

// Get comments for a post
export const getComments = (req, res) => {
  const { postId } = req.params;
  
  const postComments = comments.filter(c => c.postId === parseInt(postId));
  
  res.json({ success: true, comments: postComments });
};

// Add comment to post
export const addComment = (req, res) => {
  const { postId } = req.params;
  const { content, author, authorEmail, isExpert } = req.body;
  
  if (!content) {
    return res.status(400).json({ success: false, message: 'Content required' });
  }
  
  const newComment = {
    id: comments.length + 1,
    postId: parseInt(postId),
    content,
    author: author || 'Anonymous',
    authorEmail,
    votes: 0,
    createdAt: new Date(),
    isExpert: isExpert || false
  };
  
  comments.unshift(newComment);
  
  // Update reply count
  const post = posts.find(p => p.id === parseInt(postId));
  if (post) {
    post.replies += 1;
  }
  
  res.json({ success: true, comment: newComment });
};
