import React from 'react';
import { Shield, Puzzle, Trophy } from 'lucide-react';
import Navbar from './Navbar';
import './homepage.css';


const HomePage = () => {

  return (
    <div className="home-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Left Side - Images */}
          <div className="hero-images">
            <div className="main-circle">
              <img 
                src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=500&h=500&fit=crop" 
                alt="Professional Lawyer" 
                className="lawyer-image"
              />
            </div>
            <div className="scale-circle">
              <img 
                src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&h=300&fit=crop" 
                alt="Justice Scale" 
                className="scale-image"
              />
            </div>
            {/* Decorative Elements */}
            <div className="dot dot-1"></div>
            <div className="dot dot-2"></div>
            <div className="dot dot-3"></div>
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="icon-bg icon-bg-1">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>
              </svg>
            </div>
            <div className="icon-bg icon-bg-2">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>
              </svg>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="hero-content">
            <h1 className="hero-title">
              Trusted Counsel & Results-Driven Advocacy from Experienced Attorneys
            </h1>
            <p className="hero-description">
              Legal help made simple. Find verified lawyers, ask free legal questions, 
              and get expert guidance—all in one secure and easy-to-use platform.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-section">
        <h2 className="section-title">Why choose us?</h2>
        
        <div className="features-grid">
          {/* Feature 1 - Experienced & Dedicated */}
          <div className="feature-card feature-card-special">
            <h3 className="feature-title-main">Experienced & Dedicated:</h3>
            <p className="feature-description">
              Every case is unique, and so is our approach. Our lawyers create 
              tailored legal solutions designed specifically for your situation
            </p>
          </div>

          {/* Feature 2 - Promise */}
          <div className="feature-card">
            <div className="feature-icon-wrapper blue">
              <Shield size={40} strokeWidth={1.5} />
            </div>
            <h3 className="feature-name">Promise</h3>
            <p className="feature-description">
              Our network is built with experienced and dedicated lawyers who put 
              clients first. We focus on quality, trust, and long-term legal support
            </p>
          </div>

          {/* Feature 3 - Personalised Strategy */}
          <div className="feature-card">
            <div className="feature-icon-wrapper orange">
              <Puzzle size={40} strokeWidth={1.5} />
            </div>
            <h3 className="feature-name">Personalised Strategy</h3>
            <p className="feature-description">
              We deliver personalised legal strategies based on your unique needs. 
              Each solution is focused, precise, and results-driven.
            </p>
          </div>

          {/* Feature 4 - Commitment to Result */}
          <div className="feature-card">
            <div className="feature-icon-wrapper red">
              <Trophy size={40} strokeWidth={1.5} />
            </div>
            <h3 className="feature-name">Commitment to result</h3>
            <p className="feature-description">
              Our team is focused on results, not just advice. We work with a 
              goal-oriented approach to ensure effective legal outcomes
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
