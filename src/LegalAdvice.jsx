import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './LegalAdvice.css';
import rawQuestions from "./lawyer_queres.json";
import heroImage from "./assets/main.jpeg";
import lady from "./assets/lady.jpeg"; 

const LegalAdvice = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [rawSearch, setRawSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const formatCategory = (tag) =>
    tag
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase()) || "General";

  const faqData = useMemo(
    () =>
      rawQuestions.map((item, index) => ({
        id: index + 1,
        category: item.tags?.[0] || "general",
        question: item.title,
        answer: item.question_body,
        link: item.link,
      })),
    []
  );

  const categories = useMemo(() => {
    const tagSet = new Set();
    faqData.forEach((q) => {
      if (q.category) tagSet.add(q.category);
    });

    const tagsInOrder = Array.from(tagSet);

    return [
      { id: "all", label: "All Topics", value: "all" },
      ...tagsInOrder.map((tag) => ({
        id: tag,
        value: tag,
        label: formatCategory(tag),
      })),
    ];
  }, [faqData]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearchQuery(rawSearch);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(id);
  }, [rawSearch]);

  const filteredFaqs = faqData.filter((faq) => {
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const faqsPerPage = 5;
  const totalPages = Math.ceil(filteredFaqs.length / faqsPerPage) || 1;
  const startIndex = (currentPage - 1) * faqsPerPage;
  const endIndex = startIndex + faqsPerPage;
  const currentFaqs = filteredFaqs.slice(startIndex, endIndex);

  const toggleFaq = (id) => {
    setExpandedFaq((prev) => (prev === id ? null : id));
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setExpandedFaq(null);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setExpandedFaq(null);
    }
  };

  const handleFaqKeyDown = (e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFaq(id);
    }
  };

  const getVisiblePages = () => {
    const total = totalPages;
    const current = currentPage;
    const pages = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total];
    }

    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  return (
    <div className="legal-advice-page">
      <Navbar />

      <main className="legal-advice-shell">
        <header className="legal-advice-top">
  <div className="legal-advice-heading">
    <h1 className="legal-advice-title">Legal Advice</h1>
    <p className="legal-advice-subtitle">
      Browse real legal questions and answers, organised by topic.
    </p>
  </div>
  <p className="legal-advice-count">
    {filteredFaqs.length} question
    {filteredFaqs.length !== 1 ? "s" : ""} found
  </p>
</header>


        <section className="legal-advice-container">
          {/* Sticky Left Sidebar */}
          <aside className="advice-left">
            <div className="hero-section-advice">
              <div className="lawyer-circle-advice">
                <img
                  src={heroImage}
                  alt="Legal Professional"
                  className="lawyer-img-advice"
                />
              </div>
              <div className="scale-badge-advice">
                <img
                  src={lady}
                  alt="Justice Scale"
                  className="scale-img-advice"
                />
              </div>
              <div className="dec-dot-advice dot-1"></div>
              <div className="dec-dot-advice dot-2"></div>
              <div className="dec-dot-advice dot-3"></div>
              <div className="dec-circle-advice circle-1"></div>
              <div className="dec-circle-advice circle-2"></div>
            </div>
          </aside>

          {/* Right Content */}
          <section className="advice-right">
            <div className="category-buttons-wrapper">
              <div className="category-buttons">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`category-btn ${
                      selectedCategory === cat.value ? "active" : ""
                    }`}
                    onClick={() => handleCategoryClick(cat.value)}
                    type="button"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Join Forum Button */}
            <button 
              className="btn-forum"
              onClick={() => navigate('/legal-forum')}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Join Community Forum
            </button>

            <div className="faq-section">
              <div className="faq-header-row">
                <h2>Frequently Asked Questions</h2>

                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    type="button"
                  >
                    «
                  </button>

                  {getVisiblePages().map((p, idx) =>
                    p === "..." ? (
                      <span key={`dots-${idx}`} className="page-dots">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        className={`page-btn ${
                          currentPage === p ? "active" : ""
                        }`}
                        onClick={() => goToPage(p)}
                        type="button"
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    className="page-btn"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    type="button"
                  >
                    »
                  </button>
                </div>
              </div>

              <div className="faq-list">
                {currentFaqs.length > 0 ? (
                  currentFaqs.map((faq) => {
                    const isOpen = expandedFaq === faq.id;
                    const answerId = `faq-answer-${faq.id}`;

                    return (
                      <article key={faq.id} className="faq-item">
                        <div
                          className="faq-question"
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleFaq(faq.id)}
                          onKeyDown={(e) => handleFaqKeyDown(e, faq.id)}
                          aria-expanded={isOpen}
                          aria-controls={answerId}
                        >
                          <div className="faq-question-main">
                            <div className="faq-question-text">
                              <h3>{faq.question}</h3>
                              <span className="faq-category-tag">
                                {formatCategory(faq.category)}
                              </span>
                            </div>
                            {faq.link && (
                              <a
                                href={faq.link}
                                target="_blank"
                                rel="noreferrer"
                                className="faq-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View full discussion ↗
                              </a>
                            )}
                          </div>

                          <button
                            className="faq-toggle"
                            type="button"
                            aria-label={isOpen ? "Collapse answer" : "Expand answer"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFaq(faq.id);
                            }}
                          >
                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>

                        {isOpen && (
                          <div className="faq-answer" id={answerId}>
                            <p>{faq.answer}</p>
                          </div>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <div className="no-results">
                    <p>No FAQs found matching your search.</p>
                    <p className="no-results-hint">
                      Try different keywords or select another topic.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default LegalAdvice;
