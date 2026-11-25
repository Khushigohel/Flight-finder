import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/TripPlanner.css";
import Navbar from "./Navbar";

const interests = [
  { label: "Culture & History", icon: "🏛️", key: "culture" },
  { label: "Local Food", icon: "🍜", key: "food" },
  { label: "Adventure", icon: "🧗", key: "adventure" },
  { label: "Shopping", icon: "🛍️", key: "shopping" },
  { label: "Beach & Relaxation", icon: "🏖️", key: "beach" },
  { label: "Nature", icon: "🌿", key: "nature" },
  { label: "Nightlife", icon: "🌙", key: "nightlife" },
  { label: "Photography", icon: "📷", key: "photo" },
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function CustomDatePicker({ label, icon, value, onChange }) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day) => {
    const date = new Date(viewYear, viewMonth, day);
    onChange(date);
    setOpen(false);
  };

  const formatDisplay = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Build calendar grid
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="tp-datepicker" ref={ref}>
      <label className="tp-label">
        <span className="tp-label-icon">{icon}</span> {label}
      </label>
      <div
        className={`tp-date-input ${open ? "tp-date-input--active" : ""} ${value ? "tp-date-input--filled" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={value ? "tp-date-value" : "tp-date-placeholder"}>
          {value ? formatDisplay(value) : "Pick a date"}
        </span>
        <span className="tp-date-cal-icon">📅</span>
      </div>

      {open && (
        <div className="tp-calendar">
          {/* Header */}
          <div className="tp-cal-header">
            <button className="tp-cal-nav" onClick={prevMonth}>‹</button>
            <span className="tp-cal-month">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button className="tp-cal-nav" onClick={nextMonth}>›</button>
          </div>

          {/* Day names */}
          <div className="tp-cal-grid">
            {DAYS.map(d => (
              <div key={d} className="tp-cal-dayname">{d}</div>
            ))}

            {/* Empty cells + day cells */}
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;
              const thisDate = new Date(viewYear, viewMonth, day);
              const isToday = isSameDay(thisDate, today);
              const isSelected = isSameDay(thisDate, value);
              return (
                <button
                  key={day}
                  className={[
                    "tp-cal-day",
                    isToday ? "tp-cal-day--today" : "",
                    isSelected ? "tp-cal-day--selected" : "",
                  ].join(" ")}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TripPlanner() {
  const navigate = useNavigate();
  const [travelers, setTravelers] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleInterest = (key) => {
    setSelectedInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
  const formatDate = (date) => {
    if (!date) return "";
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const selectedLabels = interests
        .filter(i => selectedInterests.includes(i.key))
        .map(i => i.label);

      const payload = {
        destination,
        budget,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        interests: selectedLabels
      };

      console.log("Sending:", payload);

      const res = await fetch("http://127.0.0.1:8000/generate-trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log("Response:", data);

      localStorage.setItem("tripData", JSON.stringify(data));
      navigate("/trip-result", { state: { tripData: data } });

    } catch (err) {
      console.error(err);
      alert("Error generating trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="tp-page">
        {/* Hero Section */}
        <div className="tp-hero-section">
          <span className="tp-badge">✨ AI-Powered Trip Planning</span>
          <h1 className="tp-title">
            Plan Your Dream <br />
            <span className="tp-title-accent">Adventure</span>
          </h1>
          <p className="tp-subtitle">
            Enter your destination and preferences — we'll craft a <br />
            personalized day-by-day itinerary just for you.
          </p>
        </div>

        {/* Form Card */}
        <div className="tp-card-section">
          <div className="tp-card">

            {/* Destination */}
            <div className="tp-field">
              <label className="tp-label">
                <span className="tp-label-icon">📍</span> Destination
              </label>
              <input className="tp-input"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Tokyo, Japan" />
            </div>

            {/* Budget */}
            <div className="tp-field">
              <label className="tp-label">
                <span className="tp-label-icon">💲</span> Budget
              </label>
              <input className="tp-input"
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. $2000 per person" />
            </div>

            {/* Start Date & End Date */}
            <div className="tp-row">
              <CustomDatePicker
                label="Start Date"
                icon="📅"
                value={startDate}
                onChange={setStartDate}
              />
              <CustomDatePicker
                label="End Date"
                icon="📅"
                value={endDate}
                onChange={setEndDate}
              />
            </div>

            {/* Travelers */}
            <div className="tp-field">
              <label className="tp-label">
                <span className="tp-label-icon">👥</span> Travelers
              </label>
              <div className="tp-travelers">
                <button className="tp-counter-btn" onClick={() => setTravelers(t => Math.max(1, t - 1))}>−</button>
                <span className="tp-counter-val">{travelers}</span>
                <button className="tp-counter-btn" onClick={() => setTravelers(t => t + 1)}>+</button>
              </div>
            </div>

            {/* Interests */}
            <div className="tp-field">
              <label className="tp-label">
                <span className="tp-label-icon">❤️</span> Interests
              </label>
              <div className="tp-tags">
                {interests.map(({ label, icon, key }) => (
                  <button
                    key={key}
                    className={`tp-tag ${selectedInterests.includes(key) ? "tp-tag-active" : ""}`}
                    onClick={() => toggleInterest(key)}
                  >
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button className="tp-submit-btn" onClick={handleSubmit}>
              {loading ? "Generating Your Trip..." : "✈ Plan My Trip"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}