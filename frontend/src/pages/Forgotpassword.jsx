import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/login.css"
import { toast } from "react-toastify";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const navigate = useNavigate();

    const handleSendOtp = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/users/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                console.log("NAVIGATING...");
                toast.success(data.message);
                localStorage.setItem("resetEmail", email);
                localStorage.setItem("otpType", "forgot");
                navigate("/verify-otp", {
                    state: { email, type: "forgot" }
                });
            } else {
                toast.error(data.detail);
            }

        } catch (err) {
            toast.error("Server error");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Forgot Password</h2>

                <input
                    type="email"
                    placeholder="Enter email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <button type="button" onClick={handleSendOtp}>Send OTP</button>
            </div>
        </div>
    );
};

export default ForgotPassword;