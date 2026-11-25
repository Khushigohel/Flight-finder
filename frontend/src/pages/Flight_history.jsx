import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/history.css";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";


const Flight_history = () => {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await axios.get("http://127.0.0.1:8000/search-history", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
    };

    fetchHistory();
  }, []);
  const formatDate = (date) => {
    if (!date) return "";

    const [year, month, day] = date.split("-");

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    return `${day} ${months[month - 1]}`;
  };

  return (
    <>
      <Navbar />

      <div className="history-wrapper">
        <div className="history-content-area">

          <div className="history-header-section">
            <h1>📜 Your Recent Searches</h1>
            <p>Pick up where you left off</p>
          </div>

          <div className="history-grid-layout">

            {history.length > 0 ? (
              history.map((item) => {

                const isOneWay =
                  !item.end_date || item.end_date === item.start_date;

                return (
                  <div key={item.id} className="pro-history-card">

                    <div className="card-top-row">

                      {/* ROUTE */}
                      <div className="route-container">

                        <div className="city-group">
                          <span className="city-label">FROM</span>
                          <span className="city-name">{item.source}</span>
                        </div>

                        <div className="route-visual">
                          <div className="dot"></div>
                          <div className="plane-path">✈︎</div>
                          <div className="dot"></div>
                        </div>

                        <div className="city-group">
                          <span className="city-label">TO</span>
                          <span className="city-name">
                            {item.destinations.split(",").join(" → ")}
                          </span>
                        </div>

                      </div>

                      {/* DATE + TRIP TYPE */}
                      <div className="card-side-info">

                        <div className="date-badge-pro">
                          <span className="calendar-icon">📅</span>

                          {formatDate(item.start_date)}

                          {!isOneWay &&
                            ` - ${formatDate(item.end_date)}`}
                        </div>

                        <span className={`trip-tag-pro ${isOneWay ? "ow" : "rt"}`}>
                          {isOneWay ? "ONE WAY" : "ROUND TRIP"}
                        </span>

                      </div>

                    </div>

                    {/* BOTTOM */}
                    <div className="card-bottom-row">

                      <span className="search-meta">
                        Searched on {new Date(item.searched_at).toLocaleDateString()}
                      </span>

                      <button
                        className="pro-find-btn"
                        onClick={() =>
                          navigate("/", {
                            state: {
                              source: item.source,
                              destinations: item.destinations.replace(/\s/g, ""),
                              start_date: item.start_date,
                              end_date: item.end_date
                            }
                          })
                        }
                      >
                        Find Flights
                      </button>

                    </div>

                  </div>
                );
              })
            ) : (
              <div className="empty-history-pro">
                <h2>✈ Start your journey</h2>
                <p>No recent searches found</p>
                <button onClick={() => navigate("/")}>
                  Search Flights
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default Flight_history;
