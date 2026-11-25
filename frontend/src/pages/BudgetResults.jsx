import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import "../css/budgetres.css";
import Loader from "./FlightLoader";


export default function BudgetResults() {

    const location = useLocation();
    const navigate = useNavigate();

    const state = location.state || {};
    const results = state.destinations || [];
    const fromAirport = state.fromAirport;
    const departureDate = state.departureDate;
    const budget = state.budget;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 1500);
    }, []);
    if (!location.state) {
        return (
            <>
                <Navbar />
                <div className="no-data">
                    <div className="no-data-box">
                        <div className="no-data-icon">✈️</div>
                        <h2>No destinations found</h2>
                        <p>Try adjusting your budget or departure city</p>

                        <button onClick={() => navigate("/")} className="back-btn">
                            ← Go Back
                        </button>
                    </div>
                </div>
            </>
        );
    }
    if (loading) {
        return <Loader />;
    }
    return (
        <>
            <Navbar />
            <div className="budget-hero">
                <div className="budget-hero-content">
                    <h2>
                        ✈ Explore other destinations from ({fromAirport?.city} - {fromAirport?.airport_code}) under (₹{budget}) budget
                    </h2>

                    <p>
                        {departureDate &&
                            new Date(departureDate).toDateString()}
                    </p>
                </div>
            </div>
            <div className="budget-results">

                <div className="budget-grid">
                    {results && results.length > 0 ? (
                        results.map((item, index) => (

                            <div
                                className="budget-card"
                                onClick={() => {
                                    setLoading(true);

                                    setTimeout(() => {
                                        navigate("/flight-result", {
                                            state: {
                                                fromAirport,
                                                toAirport: [{ airport_code: item.airport, city: item.city }],
                                                departureDate
                                            }
                                        });
                                    }, 800); // smooth delay
                                }}
                            >
                                {/* HEADER */}
                                <div className="flight-header">
                                    <span className="city-icon">🌆</span>
                                    <div>
                                        <div className="budget-city">{item.city}</div>
                                    </div>
                                </div>

                                {/* ROUTE */}
                                <div className="flight-route">
                                    <span>{fromAirport?.airport_code}</span>
                                    <span className="route-line">
                                        <span className="plane">✈</span>
                                    </span>
                                    <span>{item.airport}</span>
                                </div>
                                <div className="flight-footer">
                                    <div className="budget-price">₹{item.price}</div>
                                    <div className="view-btn">View →</div>
                                </div>

                            </div>
                        ))
                    ) : (
                        <div className="no-results">
                            <div className="no-results-box">

                                <div className="no-results-icon">✈️</div>

                                <h3>No destinations found</h3>

                                <p>
                                    Try increasing your budget or choosing a different departure city.
                                </p>

                                <button
                                    className="retry-btn"
                                    onClick={() => navigate("/")}
                                >
                                    🔍 Search Again
                                </button>

                            </div>
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}