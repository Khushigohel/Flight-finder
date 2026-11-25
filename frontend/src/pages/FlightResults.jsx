import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import "../css/flighthome.css";
import Loader from "./FlightLoader";

export default function FlightResults() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!location.state) {
            navigate("/");
        }
    }, [location, navigate]);

    const {
        flights: initialFlights,
        summary,
        message,
        date_prices,
        fromAirport,
        toAirport,
        departureDate,
        returnDate,
        tripType
    } = location.state || {};

    const [stopFilters, setStopFilters] = useState([]);
    const [airlineFilters, setAirlineFilters] = useState([]);
    const [departureFilter, setDepartureFilter] = useState("any");
    const [loading, setLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(true);
    const [flights, setFlights] = useState(initialFlights || []);
    const [sortType, setSortType] = useState("best");
    const [datePrices, setDatePrices] = useState([]);
    const [summaryState, setSummary] = useState(summary);
    const [selectedDate, setSelectedDate] = useState(departureDate);
    const [placesLoading, setPlacesLoading] = useState(false);
    const [places, setPlaces] = useState([]);
    const [skip, setSkip] = useState(0);
    const limit = 6;
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (!location.state) navigate("/");
    }, [location, navigate]);

    useEffect(() => {
        if (!initialFlights && fromAirport && toAirport && departureDate) {
            fetchFlights(departureDate);
        } else {
            setTimeout(() => {
                setLoading(false);
                setTimeout(() => setContentLoading(false), 1000);
            }, 1500);
        }
    }, []);

    const fetchFlights = async (date) => {
        const token = localStorage.getItem("token");
        setLoading(true);
        setContentLoading(true);
        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/search-flights",
                {
                    source: fromAirport.airport_code,
                    destinations: toAirport.map(a => a.airport_code),
                    start_date: new Date(date).toLocaleDateString("en-CA")
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setFlights(response.data.flights || []);
            setSummary(response.data.summary || {});

            if (response.data.date_prices) {
                setDatePrices(
                    response.data.date_prices.map(d => ({
                        date: new Date(d.date + "T00:00:00"),
                        price: d.price
                    }))
                );
            }

            setSelectedDate(date);

        } catch (err) {
            console.log("Flight fetch failed", err);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setContentLoading(false);
            }, 1000);
        }
    };
    const toggleFilter = (value, list, setList) => {
        if (list.includes(value)) {
            setList(list.filter((v) => v !== value));
        } else {
            setList([...list, value]);
        }
    };
useEffect(() => {
        if (date_prices) {
            setDatePrices(
                date_prices.map(d => ({
                    date: new Date(d.date + "T00:00:00"),
                    price: d.price
                }))
            );
        }

    }, [date_prices]);

   const fetchPlaces = async () => {
    if (placesLoading || !hasMore) return;

    const destinationAirport = toAirport?.[0]?.airport_code;
    if (!destinationAirport) return;

    setPlacesLoading(true);

    try {
        const res = await axios.get(
            `http://127.0.0.1:8000/tourist-places/${destinationAirport}?skip=${skip}&limit=${limit}`
        );

        const newPlaces = res.data;

        // Mark end of data
        if (newPlaces.length < limit) setHasMore(false);

        // Combine previous + new while removing duplicates by place_name + lat/lng
        setPlaces(prev => {
            const combined = [...prev, ...newPlaces];

            const unique = Array.from(
                new Map(
                    combined.map(p => [
                        `${p.place_name.toLowerCase()}-${p.latitude}-${p.longitude}`,
                        p
                    ])
                ).values()
            );

            return unique;
        });

        setSkip(prev => prev + limit);

    } catch (err) {
        console.log("Failed to load tourist places", err);
    } finally {
        setPlacesLoading(false);
    }
};
    useEffect(() => {
    const handleScroll = () => {
        if (placesLoading || !hasMore) return;
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const fullHeight = document.documentElement.scrollHeight;

        if (scrollTop + windowHeight >= fullHeight - 200) {
            fetchPlaces();
        }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
}, [placesLoading, hasMore]);

    useEffect(() => {
        if (toAirport) {
            setPlaces([]);
            setSkip(0);
            setHasMore(true);
                fetchPlaces();
        }
    }, [toAirport]);

    // Sort flights
    const getSortedFlights = () => {

        let sorted = [...flights];
        if (stopFilters.length > 0) {
            sorted = sorted.filter(f => stopFilters.includes(f.stops));
        }
        if (airlineFilters.length > 0) {
            sorted = sorted.filter(f => airlineFilters.includes(f.airline_name));
        }
        if (departureFilter !== "any") {

            sorted = sorted.filter(f => {

                const hour = new Date(f.departure_time).getHours();

                if (departureFilter === "morning") return hour >= 6 && hour < 12;
                if (departureFilter === "afternoon") return hour >= 12 && hour < 18;
                if (departureFilter === "evening") return hour >= 18 && hour <= 23;

                return true;

            });
        }
        if (sortType === "cheapest") {
            return sorted.sort((a, b) => a.price - b.price);
        }

        if (sortType === "fastest") {

            return sorted.sort((a, b) => {

                const durA = new Date(a.arrival_time) - new Date(a.departure_time);
                const durB = new Date(b.arrival_time) - new Date(b.departure_time);

                return durA - durB;
            });
        }
        return sorted;

    };

    // Search by clicking date bar
    const searchByDate = async (date) => {

        const token = localStorage.getItem("token");
        setContentLoading(true);

        try {

            const response = await axios.post(
                "http://127.0.0.1:8000/search-flights",
                {
                    source: fromAirport.airport_code,
                    destinations: toAirport.map((a) => a.airport_code),
                    start_date: date.toLocaleDateString("en-CA")
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setFlights(response.data.flights);
            setSelectedDate(date.toISOString());

            if (response.data.summary) {
                setSummary(response.data.summary);
            }
            setTimeout(() => {
                setContentLoading(false);
            }, 1000);


        } catch (error) {
            console.log("Date search failed");

        }

    };
    if (loading) {
        return <Loader />;
    }

    return (
        <>
            <Navbar />

            <div className="hero">

                <div className="hero-header">

                    <div className="hero-content">

                        <div
                            className="route-header clickable-search"
                            onClick={() =>
                                navigate("/", {
                                    state: {
                                        fromAirport,
                                        toAirport,
                                        departureDate
                                    }
                                })
                            }
                        >
                            {contentLoading ? (
                                <div className="skeleton-line w-40" style={{ height: "20px" }}></div>
                            ) : (

                                <h2 className="route-title">
                                    <span className="search-icon">🔍</span>

                                    {fromAirport?.city} ({fromAirport?.airport_code})
                                    {" ✈ "}
                                    {
                                        toAirport?.length > 0
                                            ? toAirport.map(a => `${a.city} (${a.airport_code})`).join(", ")
                                            : ""
                                    }
                                </h2>

                            )}
                            {contentLoading ? (
                                <div className="skeleton-line w-40" style={{ height: "20px" }}></div>
                            ) : (
                                <p style={{ color: "#ddd" }}>
                                    {departureDate &&
                                        new Date(departureDate).toLocaleDateString("en-GB", {
                                            weekday: "short",
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })
                                    }
                                    {tripType === "roundway" && returnDate && (
                                        <>
                                            {"  →  "}
                                            {new Date(returnDate).toLocaleDateString("en-GB", {
                                                weekday: "short",
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric"
                                            })}
                                        </>
                                    )}
                                </p>
                            )}

                        </div>

                        {/* DATE PRICE BAR */}
                        {contentLoading ? (
                            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                {[1, 2, 3, 4, 5].map((_, i) => (
                                    <div key={i} className="skeleton-box"></div>
                                ))}
                            </div>
                        ) : (
                            datePrices.length > 0 && (
                                <div className="date-price-bar">

                                    {datePrices.map((d, index) => {

                                        const isSelected =
                                            selectedDate &&
                                            d.date.toDateString() === new Date(selectedDate).toDateString();

                                        return (
                                            <div
                                                key={index}
                                                className={`date-card ${isSelected ? "active" : ""}`}

                                                onClick={() => {
                                                    searchByDate(d.date);
                                                }}
                                            >
                                                <div className="date">
                                                    {d.date.toLocaleDateString("en-GB", {
                                                        day: "numeric",
                                                        month: "short"
                                                    })}
                                                </div>

                                                <div className="price">
                                                    {d.price ? `₹${d.price}` : "---"}
                                                </div>

                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        )}

                    </div>

                </div>

            </div >

            {/* MESSAGE */}
            < div className="results-section" >
                <div className="results-inner">
                    <div className="results-layout">
                        {/* LEFT SIDEBAR */}
                        <div className="filter-sidebar">

                            {contentLoading ? (
                                <>
                                    <div className="skeleton-line w-50" style={{ height: "20px", marginBottom: "20px" }}></div>
                                    <div className="skeleton-box"></div>
                                    <div className="skeleton-box"></div>
                                    <div className="skeleton-box"></div>
                                </>
                            ) : (
                                <>
                                    <h3>Filters</h3>

                                    <div className="filter-group">
                                        <p>Stops</p>

                                        <label>
                                            <input type="checkbox" onChange={() => toggleFilter(0, stopFilters, setStopFilters)} /> Non-stop
                                        </label>

                                        <label>
                                            <input type="checkbox" onChange={() => toggleFilter(1, stopFilters, setStopFilters)} /> 1 Stop
                                        </label>

                                        <label>
                                            <input type="checkbox" onChange={() => toggleFilter(2, stopFilters, setStopFilters)} /> 2 Stops
                                        </label>
                                    </div>

                                    <div className="filter-group">
                                        <p>Airlines</p>

                                        <label>
                                            <input type="checkbox" onChange={() => toggleFilter("IndiGo", airlineFilters, setAirlineFilters)} /> IndiGo
                                        </label>

                                        <label>
                                            <input type="checkbox" onChange={() => toggleFilter("Air India", airlineFilters, setAirlineFilters)} /> Air India
                                        </label>

                                        <label>
                                            <input type="checkbox" onChange={() => toggleFilter("Vistara", airlineFilters, setAirlineFilters)} /> Vistara
                                        </label>

                                        <label>
                                            <input type="checkbox" onChange={() => toggleFilter("Akasa Air", airlineFilters, setAirlineFilters)} /> Akasa Air
                                        </label>

                                        <label>
                                            <input type="checkbox" onChange={() => toggleFilter("SpiceJet", airlineFilters, setAirlineFilters)} /> SpiceJet
                                        </label>
                                    </div>

                                    <div className="filter-group">
                                        <p>Departure Time</p>

                                        <label>
                                            <input type="radio" name="departureTime" value="any"
                                                checked={departureFilter == "any"}
                                                onChange={(e) => setDepartureFilter(e.target.value)} />
                                            Any time
                                        </label>

                                        <label>
                                            <input type="radio" name="departureTime" value="morning"
                                                checked={departureFilter == "morning"}
                                                onChange={(e) => setDepartureFilter(e.target.value)} />
                                            Morning (6-12)
                                        </label>

                                        <label>
                                            <input type="radio" name="departureTime" value="afternoon"
                                                checked={departureFilter == "afternoon"}
                                                onChange={(e) => setDepartureFilter(e.target.value)} />
                                            Afternoon (12-18)
                                        </label>

                                        <label>
                                            <input type="radio" name="departureTime" value="evening"
                                                checked={departureFilter == "evening"}
                                                onChange={(e) => setDepartureFilter(e.target.value)} />
                                            Evening (18-24)
                                        </label>
                                    </div>
                                </>
                            )}

                        </div>

                        <div className="results-main">
                            {contentLoading ? (
                                <div style={{ display: "flex", gap: "15px" }}>
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="skeleton-tab">
                                            <div className="skeleton-line w-10"></div>
                                            <div className="skeleton-line w-10"></div>
                                            <div className="skeleton-line w-10"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                message && (
                                    <div className="search-message">
                                        {message}
                                    </div>
                                )
                            )}
                            {/* FILTER TABS */}
                            <div className="filter-tabs">
                                {contentLoading ? (
                                    <div style={{ display: "flex", gap: "15px" }}>
                                        {[1, 2, 3].map((_, i) => (
                                            <div key={i} className="skeleton-tab">
                                                <div className="skeleton-line w-40"></div>
                                                <div className="skeleton-line w-60"></div>
                                                <div className="skeleton-line w-30"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className={`tab ${sortType === "best" ? "active" : ""}`}
                                            onClick={() => setSortType("best")}
                                        >
                                            <span className="tab-label">Best</span>
                                            <span className="tab-price">₹{summaryState?.best?.price || "---"}</span>
                                            <span className="tab-time">{summaryState?.best?.duration || ""}</span>
                                        </div>

                                        <div
                                            className={`tab ${sortType === "cheapest" ? "active" : ""}`}
                                            onClick={() => setSortType("cheapest")}
                                        >
                                            <span className="tab-label">Cheapest</span>
                                            <span className="tab-price">₹{summaryState?.cheapest?.price || "---"}</span>
                                            <span className="tab-time">{summaryState?.cheapest?.duration || ""}</span>
                                        </div>

                                        <div
                                            className={`tab ${sortType === "fastest" ? "active" : ""}`}
                                            onClick={() => setSortType("fastest")}
                                        >
                                            <span className="tab-label">Fastest</span>
                                            <span className="tab-price">₹{summaryState?.fastest?.price || "---"}</span>
                                            <span className="tab-time">{summaryState?.fastest?.duration || ""}</span>
                                        </div>
                                    </>
                                )}

                            </div>

                            {/* FLIGHT LIST */}

                            <div className="scrollable-flights">
                                {contentLoading ? (
                                    <>
                                        {[1, 2, 3, 4, 5].map((_, i) => (
                                            <div key={i} className="main-card skeleton-card">

                                                <div className="card-left">
                                                    <div className="skeleton-circle"></div>

                                                    <div className="journey-details">
                                                        <div className="skeleton-line w-30"></div>
                                                        <div className="skeleton-line w-60"></div>
                                                        <div className="skeleton-line w-40"></div>
                                                    </div>
                                                </div>

                                                <div className="card-right">
                                                    <div className="skeleton-line w-50"></div>
                                                    <div className="skeleton-btn"></div>
                                                </div>

                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    getSortedFlights().map((flight) => {

                                        const depTime = new Date(flight.departure_time)
                                            .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

                                        const arrTime = new Date(flight.arrival_time)
                                            .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

                                        const durationMs = new Date(flight.arrival_time) - new Date(flight.departure_time);

                                        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));

                                        const durationMinutes = Math.floor(
                                            (durationMs % (1000 * 60 * 60)) / (1000 * 60)
                                        );

                                        return (

                                            <div key={flight.flight_id} className="main-card">

                                                <div className="card-left">

                                                    <div className="airline-logo-box">
                                                        <div className="placeholder-logo">
                                                            {flight.airline_name[0]}
                                                        </div>
                                                    </div>

                                                    <div className="journey-details">

                                                        <div className="time-group">
                                                            <span className="time">{depTime}</span>
                                                            <span className="code">{flight.source_airport}</span>
                                                        </div>

                                                        <div className="duration-visual">

                                                            <span className="duration-val">
                                                                {durationHours}h {durationMinutes}m
                                                            </span>

                                                            <div className="line-with-plane">
                                                                <div className="horizontal-line"></div>
                                                                <span className="plane-icon">✈</span>
                                                            </div>

                                                            <span className="stop-info direct">
                                                                {flight.stops === 0 ? "Direct" : `${flight.stops} Stop`}
                                                            </span>

                                                        </div>

                                                        <div className="time-group">
                                                            <span className="time">{arrTime}</span>
                                                            <span className="code">{flight.destination_airport}</span>
                                                        </div>

                                                    </div>

                                                </div>

                                                <div className="card-right">

                                                    <div className="price-info">
                                                        <span className="main-price">
                                                            {flight.currency} {flight.price}
                                                        </span>
                                                    </div>

                                                    <button className="select-action-btn">
                                                        Select →
                                                    </button>

                                                </div>

                                            </div>

                                        );

                                    })
                                )}

                            </div>
                        </div>

                    </div>
                </div>
            </div >
            {/* TOURIST PLACES */}
            <section className="tourist-section">

                <div className="tourist-inner">

                    <h2>
                        Top Places to Visit in {toAirport?.[0]?.city} ({toAirport?.[0]?.airport_code})
                    </h2>

                    <div className="places-grid">

                        {placesLoading && places.length === 0 ? (
                            [1, 2, 3, 4].map((_, i) => (
                                <div key={i} className="place-card">
                                    <div className="skeleton-image"></div>
                                    <div className="place-content">
                                        <div className="skeleton-line w-60"></div>
                                        <div className="skeleton-line w-90"></div>
                                        <div className="skeleton-line w-40"></div>
                                    </div>
                                </div>
                            ))
                        ) : places.length > 0 ? (
                            places.map((place, index) => (
                                <div key={index} className="place-card">

                                    <img
                                        src={place.image_url}
                                        alt={place.place_name}
                                        className="place-image"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.src = "https://www.trawell.in/images/pics/ahmedabad_300_main.jpg";
                                        }}
                                    />

                                    <div className="place-content">
                                        <h3>{place.place_name}</h3>

                                        <p>
                                            {place.description?.length > 120
                                                ? place.description.slice(0, 120) + "..."
                                                : place.description}
                                        </p>

                                        <p>📍 {place.distance_from_airport} km from Airport</p>
                                    </div>

                                </div>
                            ))
                        ) : (
                            <div style={{ width: "100%", textAlign: "center", padding: "40px", color: "black" }}>
                                <p>No tourist places found 😕</p>
                            </div>
                        )}

                    </div>

                    {/* 👇 ADD THIS */}
                    <div style={{ textAlign: "center", marginTop: "20px", color: "black" }}>

                        {placesLoading ? (
                            <p>Loading...</p>
                        ) : hasMore ? (
                            <button className="load-more-btn" onClick={fetchPlaces}>
                                Load More Places ↓
                            </button>
                        ) : (
                            <p>No more places 🚀</p>
                        )}

                    </div>

                </div>

            </section>

        </>
    );
}