// src/login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "./Auth.css";
import { useAuth } from "./AuthContext";
import logo from "./assets/logo login.jpeg";

const Login = () => {
  const navigate = useNavigate();
  const { loginEmail, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginEmail({ email, password });
      navigate("/home");
    } catch (err) {
      alert(err.code || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/home");
    } catch (err) {
      alert(err.code || err.message || "Google login failed");
    }
  };

  return (
    <div className="auth-container">
      {/* Left Side - Branding */}
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

      {/* Right Side - Form */}
      <div className="auth-right">
        <div className="auth-form-container">
          <h2 className="form-title">Login.</h2>
          <p className="form-subtitle">Legal Solutions at Home.</p>

          <form onSubmit={handleSubmit}>
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

            <div className="input-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="remember-me">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="switch-auth">
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="switch-auth-btn"
              >
                Create Account?
              </button>
            </p>

            {/* ⭐ NEW Google Button at Bottom */}
            <div className="google-bottom-wrapper">
              <button
                type="button"
                className="google-btn-bottom"
                onClick={handleGoogleLogin}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                  className="google-logo"
                />
                Continue with Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
