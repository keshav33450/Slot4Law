// src/Navbar.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "lucide-react";
import "./Navbar.css";
import { useAuth } from "./AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [avatarError, setAvatarError] = useState(false);

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

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("/home")}>
          <svg className="logo-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
          </svg>
          <span className="logo-text">LegalMeet</span>
        </div>

        {/* Navigation */}
        <ul className="navbar-menu">
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/find-lawyer">Find a Lawyer</Link></li>
          <li><Link to="/ask-question">Ask a Free Question</Link></li>
          <li><Link to="/legal-advice">Legal Advice</Link></li>
          <li><Link to="/about-us">About Us</Link></li>

          {/* ✅ My Bookings */}
          {user && (
            <li>
              <Link to="/my-bookings">My Bookings</Link>
            </li>
          )}
        </ul>

        {/* Right side */}
        <div className="navbar-actions">
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
    </nav>
  );
};

export default Navbar;
