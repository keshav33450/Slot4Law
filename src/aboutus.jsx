// src/AboutUs.jsx
import React, { useState } from "react";
import Navbar from "./Navbar";            // keep your existing Navbar
import "./aboutus.css";                  // styles (see below)
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const AboutUs = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // {type: 'success' | 'error', message: string}

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("➡️ Handle submit called");
    setStatus(null);

    if (!name || !email || !feedback) {
      console.log("❌ Validation failed");
      setStatus({
        type: "error",
        message: "Please fill in name, email and feedback.",
      });
      return;
    }

    try {
      setLoading(true);
      console.log("📝 Trying to add document to Firestore...");

      const docRef = await addDoc(collection(db, "contactMessages"), {
        name,
        email,
        phone,
        feedback,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Document written with ID:", docRef.id);

      setStatus({
        type: "success",
        message: "Thank you! Your message has been submitted.",
      });

      // clear form
      setName("");
      setEmail("");
      setPhone("");
      setFeedback("");
    } catch (err) {
      console.error("🔥 Error saving feedback:", err);
      setStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      console.log("⬅️ Finished submit (turning off loading)");
      setLoading(false);
    }
  };

  return (
    <div className="about-page">
      <Navbar />

      <main className="about-shell">
        {/* =========== TOP SECTION: CONTACT + HERO =========== */}
        <section className="about-hero">
          {/* Left: image composition */}
          <div className="about-hero-left">
            <div className="about-main-circle">
              <img
                src="https://images.unsplash.com/photo-1528460033278-a6ba57020470?w=800&h=800&fit=crop"
                alt="Graduate in legal attire"
              />
            </div>

            <div className="about-secondary-circle">
              <img
                src="https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&h=600&fit=crop"
                alt="Justice scales"
              />
            </div>

            <span className="about-dot dot-1"></span>
            <span className="about-dot dot-2"></span>
            <span className="about-dot dot-3"></span>
            <span className="about-ring ring-1"></span>
          </div>

          {/* Right: contact form */}
          <div className="about-hero-right">
            <h1 className="about-contact-title">Contact Us</h1>
            <p className="about-contact-intro">
              Have a question or want to share feedback? Fill out the form and
              our team will get back to you.
            </p>

            <div className="about-contact-card">
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="contact-row">
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="contact-row">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="contact-row">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="contact-row">
                  <label htmlFor="feedback">Feedback / Message</label>
                  <textarea
                    id="feedback"
                    rows={4}
                    placeholder="Tell us how we can help you..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    required
                  />
                </div>

                {status && (
                  <p
                    className={`contact-status ${
                      status.type === "success"
                        ? "contact-status-success"
                        : "contact-status-error"
                    }`}
                  >
                    {status.message}
                  </p>
                )}

                <button
                  type="submit"
                  className="contact-submit-btn"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* =========== ABOUT TEXT =========== */}
        <section className="about-content">
          <header className="about-heading-block">
            <h2 className="about-title">About Us</h2>
            <p className="about-subtitle">
              Learn why people choose LegalMeet for legal solutions and
              consultation.
            </p>
          </header>

          <div className="about-text-grid">
            <p>
              At <strong>LegalMeet</strong>, we are redefining the way
              individuals and businesses access legal support. Our platform
              brings together verified legal professionals from across the
              country, enabling clients to discover, connect, and schedule
              consultations with trusted lawyers in just a few clicks.
            </p>
            <p>
              We operate with a mission to make legal assistance transparent,
              accessible, and hassle-free for everyone. Whether you are seeking
              guidance for family matters, property issues, employment disputes,
              or business contracts, LegalMeet helps you find the right lawyer
              based on expertise, location, and real-world experience.
            </p>
            <p>
              We understand that navigating the legal system can be
              overwhelming. That’s why we built a streamlined, user-centric
              platform that focuses on clarity and trust. From asking free
              questions to booking paid consultations, every interaction on
              LegalMeet is designed to protect your privacy and save your time.
            </p>
          </div>
        </section>

        {/* =========== STATS / VALUE CARDS =========== */}
        <section className="about-stats-section">
          <div className="about-stats-card">
            <h3>4,000+</h3>
            <p>Legal questions answered</p>
          </div>
          <div className="about-stats-card">
            <h3>500+</h3>
            <p>Verified lawyers on the platform</p>
          </div>
          <div className="about-stats-card">
            <h3>24x7</h3>
            <p>Access to legal information</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutUs;
