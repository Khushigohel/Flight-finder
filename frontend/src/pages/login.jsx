import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../css/login.css";
import { GoogleLogin } from "@react-oauth/google";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import Navbar from "./Navbar";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Normal Login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail || "Login failed ❌");
        return;
      }

      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("name", data.name);
      localStorage.setItem("token", data.access_token);
      toast.success("Login Successful ✈️");

      setTimeout(() => {
        navigate("/");
      }, 1200);

    } catch (err) {
      toast.error("Server not reachable 🚫");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
  try {
    const res = await axios.post(
      "http://127.0.0.1:8000/auth/google_auth",
      { token: credentialResponse.credential }
    );

    console.log(res.data);

    localStorage.setItem("token", res.data.access_token);

    // ✅ FIX HERE
    localStorage.setItem("name", res.data.user.name);
    localStorage.setItem("email", res.data.user.email);

    navigate("/");
    window.location.reload();

  } catch (err) {
    console.error("Google login failed", err);
  }
};

  return (
    <>
      <Navbar />
      <div className="login-container">
        <div className="login-card">
          <h2>Flight Login</h2>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="forgot-password">
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            <button type="submit">Login</button>

            <div className="divider">OR</div>

            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                toast.error("Google Login Failed ❌");
              }}
            />
            <div className="create-account">
              <span>Don't have an account? </span>
              <strong> <a href="/registration">Create Account</a></strong>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}