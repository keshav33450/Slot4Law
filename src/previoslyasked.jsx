// src/PreviouslyAskedQuestions.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PreviouslyAskedQuestions.css";

const PreviouslyAskedQuestions = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Mock data - replace with actual API data later
  const [questions] = useState([
    {
      id: 1,
      category: "Criminal Law",
      title: "What are my rights during a police interrogation?",
      description: "I was called for questioning and I want to know if I can refuse to answer without a lawyer present.",
      date: "2025-12-10",
      status: "Answered",
      answers: 3,
    },
    {
      id: 2,
      category: "Family Law",
      title: "How to file for child custody after divorce?",
      description: "Need guidance on the legal process for obtaining primary custody of my children.",
      date: "2025-12-08",
      status: "Pending",
      answers: 0,
    },
    {
      id: 3,
      category: "Property Law",
      title: "Dispute over property boundary with neighbor",
      description: "My neighbor claims part of my land belongs to them. What documents do I need to prove ownership?",
      date: "2025-12-05",
      status: "Answered",
      answers: 5,
    },
    {
      id: 4,
      category: "Civil Law",
      title: "Can I sue for breach of contract?",
      description: "A business partner failed to fulfill their contractual obligations. What are my legal options?",
      date: "2025-12-02",
      status: "Answered",
      answers: 2,
    },
  ]);

  const categories = [
    "All",
    "Criminal Law",
    "Family Law",
    "Divorce Law",
    "Property Law",
    "Civil Law",
    "Inheritance Law",
  ];

  const filteredQuestions =
    selectedCategory === "All"
      ? questions
      : questions.filter((q) => q.category === selectedCategory);

  return (
    <div className="paq-page">
      {/* Header */}
      <header className="paq-header">
        <div className="paq-header-container">
          <div className="paq-logo">
            <div className="paq-logo-icon">⚖️</div>
            <span className="paq-logo-text">LegalMeet</span>
          </div>
          <nav className="paq-nav">
            <a href="/" className="paq-nav-link">Find a Lawyer</a>
            <a href="/" className="paq-nav-link">Legal Advice</a>
            <a href="/" className="paq-nav-link">Ask a Free Question</a>
            <a href="/" className="paq-nav-link">About us</a>
            <a href="/" className="paq-nav-link">Languages</a>
          </nav>
          <button className="paq-btn-create">Create Account</button>
          <button className="paq-btn-profile">
            <span className="paq-profile-icon">👤</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="paq-hero">
        <div className="paq-hero-content">
          <div className="paq-hero-left">
            <div className="paq-hero-image">
              <div className="paq-circle-outer">
                <div className="paq-circle-inner">
                  <span className="paq-person-icon">👨‍⚖️</span>
                </div>
              </div>
              <div className="paq-badge-icon">⚖️</div>
            </div>
          </div>
          <div className="paq-hero-right">
            <h1 className="paq-hero-title">Previously Asked Question</h1>
            <div className="paq-category-chips">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`paq-chip ${
                    selectedCategory === cat ? "paq-chip-active" : ""
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat} Queries
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Questions List */}
      <section className="paq-questions-section">
        <div className="paq-questions-container">
          {filteredQuestions.length === 0 ? (
            <div className="paq-empty-state">
              <p>No questions found in this category.</p>
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <div key={question.id} className="paq-question-card">
                <div className="paq-question-header">
                  <span className="paq-question-category">{question.category}</span>
                  <span className={`paq-question-status ${question.status.toLowerCase()}`}>
                    {question.status}
                  </span>
                </div>
                <h3 className="paq-question-title">{question.title}</h3>
                <p className="paq-question-desc">{question.description}</p>
                <div className="paq-question-footer">
                  <span className="paq-question-date">Posted on {question.date}</span>
                  <span className="paq-question-answers">
                    {question.answers} {question.answers === 1 ? "Answer" : "Answers"}
                  </span>
                </div>
                <button className="paq-btn-view">View Details</button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default PreviouslyAskedQuestions;
