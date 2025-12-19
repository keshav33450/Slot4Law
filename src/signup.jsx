import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import { useAuth } from "./AuthContext";
import logo from "./assets/logo login.jpeg";

const SignUp = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({ name, email, password });
      navigate("/home");
    } catch (err) {
      alert(err.code || err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <h1 className="brand-title">LegalMeet.</h1>
        <div className="brand-icon">
  <img
    src={logo}
    alt="LegalMeet Logo"
    className="brand-logo"
  />
</div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <h2 className="form-title">Sign Up.</h2>
          <p className="form-subtitle">Create your LegalMeet account.</p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
              <input
                type="email"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </button>

            <p className="switch-auth">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="switch-auth-btn"
              >
                Already have an account? Login
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
