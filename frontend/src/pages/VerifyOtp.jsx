import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from "react-toastify";
import "../css/style.css";
import Navbar from './Navbar';

const VerifyOTP = () => {
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(50);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || localStorage.getItem("resetEmail");
    const type = location.state?.type || localStorage.getItem("otpType");

    useEffect(() => {
        if (!email) {
            navigate("/forgot-password"); // better than /login
        }
    }, [email, navigate]);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);
        if (element.value !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleResend = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://127.0.0.1:8000/users/resend-otp?email=${email}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("New OTP sent to your email! 📧");
                setTimer(30);
                setCanResend(false);
            } else {
                toast.error(data.detail || "Failed to resend OTP");
            }
        } catch (error) {
            toast.error("Connection error. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpValue = otp.join("");
        if (otpValue.length < 6) {
            toast.error("Please enter the full 6-digit code");
            return;
        }

        try {
            setLoading(true);
            if (type === "register") {
                const response = await fetch("http://127.0.0.1:8000/users/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email, otp: otpValue })
                });

                const data = await response.json();
                if (response.ok) {
                    toast.success("Verification Successful!");
                    localStorage.removeItem("verifyEmail");
                    navigate("/login");
                } else {
                    toast.error(data.detail || "Invalid OTP");
                }
            }
            else if (type === "forgot") {
                toast.success("OTP Verified ");

                navigate("/reset-password", {
                    state: { email, otp: otpValue }
                });
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="login-container">
                <div className="login-card otp-card">
                    <h2>
                        {type === "forgot" ? "Reset Password OTP" : "Email Verification"}
                    </h2>
                    <p className="otp-subtitle">
                        Enter the code sent to <br /> <strong>{email}</strong>
                    </p>

                    <form onSubmit={handleVerify}>
                        <div className="otp-input-group">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    className="otp-box"
                                    value={data}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    onChange={(e) => handleChange(e.target, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                />
                            ))}
                        </div>

                        <button type="submit" className="verify-btn" disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>

                        <p className="resend-text">
                            {canResend ? (
                                <>
                                    Didn't receive the code?
                                    <button
                                        type="button"
                                        className="resend-btn"
                                        onClick={handleResend}
                                    >
                                        Resend Now
                                    </button>
                                </>
                            ) : (
                                <span>Resend available in <strong>{timer}s</strong></span>
                            )}
                        </p>
                    </form>
                    <ToastContainer />
                </div>
            </div>
        </>
    );
};

export default VerifyOTP;