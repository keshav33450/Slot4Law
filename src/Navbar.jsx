// src/Navbar.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "lucide-react";
import "./Navbar.css";
import { useAuth } from "./AuthContext";
import logo from "./assets/logo.jpeg";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [avatarError, setAvatarError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // ✅ mobile menu state

  const displayName =
    user?.name || user?.displayName || user?.email || "User";

  const rawAvatar = user?.photoURL || user?.picture || null;

  const avatarUrl =
    !avatarError && rawAvatar
      ? rawAvatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          displayName
        )}&background=0D8ABC&color=ffffff&size=128`;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("/home")}>
          <img src={logo} alt="LegalMeet Logo" className="logo-img" />
          <span className="logo-text">Slot4Law</span>
        </div>

        {/* Desktop Navigation */}
        <ul className="navbar-menu">
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/find-lawyer">Find a Lawyer</Link></li>
          <li><Link to="/ask-question">Ask a Free Question</Link></li>
          <li><Link to="/legal-advice">Legal Advice</Link></li>

          {user && (
            <li>
              <Link to="/my-bookings">My Bookings</Link>
            </li>
          )}

          <li><Link to="/about-us">Contact Us</Link></li>
        </ul>

        {/* Right side */}
        <div className="navbar-actions">

          {/* ✅ Mobile Hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>

          {!user ? (
            <>
              <button
                className="create-account-btn"
                onClick={() => navigate("/signup")}
              >
                Create Account
              </button>

              <button
                className="profile-btn"
                onClick={() => navigate("/login")}
              >
                <User size={24} />
              </button>
            </>
          ) : (
            <div className="user-info">
              <img
                src={avatarUrl}
                alt="profile"
                className="user-avatar"
                onError={() => setAvatarError(true)}
              />
              <span className="user-name">{displayName}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ✅ Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <Link to="/home" onClick={closeMenu}>Home</Link>
        <Link to="/find-lawyer" onClick={closeMenu}>Find a Lawyer</Link>
        <Link to="/ask-question" onClick={closeMenu}>Ask a Free Question</Link>
        <Link to="/legal-advice" onClick={closeMenu}>Legal Advice</Link>

        {user && (
          <Link to="/my-bookings" onClick={closeMenu}>
            My Bookings
          </Link>
        )}

        <Link to="/about-us" onClick={closeMenu}>Contact Us</Link>
      </div>

    </nav>
  );
};

export default Navbar;
