import React, { useState } from 'react'
import "react-toastify/dist/ReactToastify.css";
import "../css/flighthome.css";
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from "react-toastify";
import { handleError, handleSucess } from "./utils";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Navbar from './Navbar';

const Registration = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Password and confirm password do not match.");
            return false;
        }

        try {
            setLoading(true);
            const response = await fetch("http://127.0.0.1:8000/users/registration", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            })
            const data = await response.json()
            if (!response.ok) {
                if (response.status === 400) {
                    toast.error("⚠️ Email already registered. Please login.");
                } else {
                    toast.error(data.detail || "Registration failed");
                }
                return;
            }
            else {
                handleSucess("OTP sent to your email 🎉");
                localStorage.setItem("verifyEmail", formData.email);
                localStorage.setItem("otpType", "register");

                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: ""
                })
                navigate("/verify-otp", {
                    state: { email: formData.email, type: "register" }
                });
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }

    }
    return (
        <>
            <Navbar />
            <div className="login-container">
                <div className="login-card">
                    <h2>Registration</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Enter Name"
                            name='name'
                            value={formData.name}
                            onChange={handleChange}
                        />
                        <input
                            type="email"
                            placeholder="Enter Email"
                            name='email'
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <div className="password-field">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter Password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                            />

                            <span
                                className="eye-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>

                        <div className="password-field">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />

                            <span
                                className="eye-icon"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </button>

                        <p className="login-link">
                            Already Have An Account ? <a href="/login">Login</a>
                        </p>
                        <ToastContainer />
                    </form>
                </div>
            </div>
        </>
    )
}

export default Registration