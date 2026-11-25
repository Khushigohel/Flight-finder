import { useNavigate } from "react-router-dom";
import { FaPlaneDeparture } from "react-icons/fa";
import "../css/Notfound.css"
import Navbar from "./Navbar";

export default function NotFound() {

    const navigate = useNavigate();


    return (
        <>
        <Navbar/>
        <div className="flight404-wrapper">

            {/* SVG ROUTES */}
            <svg className="routes-found" viewBox="0 0 1200 600">
                <path className="route-line-found" d="M0,300 Q600,100 1200,300" />
                <path className="route-line-found" d="M0,400 Q600,200 1200,400" />
            </svg>

            {/* PLANES */}
            <div className="plane plane1">✈</div>
            <div className="plane plane2">✈</div>
            <div className="plane plane3">✈</div>

            {/* CARD */}
            <div className="flight404-card">
                <h1 className="code-found">404</h1>
                <h2>Flight Not Found</h2>
                <p>This route doesn’t exist or your flight has already departed.</p>

                <button className="found-btn" onClick={() => navigate("/")}>
                    🔍 Search Flights
                </button>
            </div>

        </div>
        </>
    )
}