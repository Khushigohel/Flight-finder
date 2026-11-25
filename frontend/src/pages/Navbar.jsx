import React, { useEffect, useState } from "react";
import "../css/Navbar.css";
import profile from "../assets/profile.jpg"
import { useNavigate } from "react-router-dom";
import { Bot, Cpu, MessageCircle, Plane, Rocket } from "lucide-react";

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const username = localStorage.getItem("name");

        if (username) {
            setUser({
                name: username,
            });
        }
    }, []);
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="logo">
                    <Plane className="brand-icon" size={28} />
                    CheapFlights
                </div>

                <div className="right-section">
                    <ul className="nav-links">
                        <li><a href="/">Home</a></li>
                    </ul>
                    <button
                        className="chatbot-btn"
                        onClick={() => navigate("/trip-plane")}
                    >
                        <Bot className="chat-icon" size={28} />
                        Trip Planner
                          <span className="new-badge">AI</span>
                    </button>
                    {!user ? (
                        <div className="nav-buttons">
                            <a href="/login" className="login-btn">Login</a>
                            <a href="/registration" className="signup-btn">Sign Up</a>
                        </div>
                    ) : (
                        <div className="profile-container">
                            <div className="profile-info" onClick={() => setOpenDropdown(!openDropdown)}>
                                <div className="profile-avatar">
                                    <img src={profile} alt="profile" />
                                </div>

                                <span className="username">{user?.name}</span>

                                <span className={`arrow ${openDropdown ? "rotate" : ""}`}>
                                    ▼
                                </span>
                            </div>
                            {openDropdown && (
                                <div className="dropdown-menu">
                                    <button onClick={() => { navigate("/history"); setOpenDropdown(false); }}>
                                        📜 Search History
                                    </button>
                                    <hr />
                                    <button onClick={handleLogout}>🚪Logout</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;