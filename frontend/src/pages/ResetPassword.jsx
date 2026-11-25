import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/login.css"
import { toast } from "react-toastify";

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    const { email, otp } = location.state || {};

    const handleReset = async () => {
        const res = await fetch("http://127.0.0.1:8000/users/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                otp,
                new_password: password
            })
        });

        if (res.ok) {
            toast.success("Password updated sucessfully!")
            navigate("/login");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Reset Password</h2>

                <input
                    type="password"
                    placeholder="New password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button onClick={handleReset}>Update Password</button>
            </div>
        </div>
    );
};

export default ResetPassword;