import { useLocation, useNavigate } from "react-router-dom";
import "../css/TripPlanner.css";
import "../css/TripResult.css";
import Navbar from "./Navbar";

// ── Category badge colours ────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  accommodation: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  food: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  sightseeing: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  adventure: { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
  shopping: { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
  transport: { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  default: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
};

function getCategoryStyle(category = "") {
  const key = category.toLowerCase();
  return (
    CATEGORY_COLORS[key] ||
    Object.entries(CATEGORY_COLORS).find(([k]) => key.includes(k))?.[1] ||
    CATEGORY_COLORS.default
  );
}

// ── Single Activity Row ───────────────────────────────────────────────────────
function ActivityItem({ activity }) {
  const style = getCategoryStyle(activity.category || activity.type || "");
  return (
    <div className="tr-activity">
      <div className="tr-activity-left">
        {(activity.time || activity.timing) && (
          <span className="tr-activity-time">
            {activity.time || activity.timing}
          </span>
        )}
        <div className="tr-activity-info">
          <span className="tr-activity-name">
            {activity.name || activity.title || activity.activity}
          </span>
          {(activity.description || activity.details) && (
            <p className="tr-activity-desc">
              {activity.description || activity.details}
            </p>
          )}
          {activity.tips && (
            <span className="tr-activity-tips">💡 {activity.tips}</span>
          )}
          {(activity.cost || activity.estimated_cost) && (
            <span className="tr-activity-cost">
              ₹ {activity.cost || activity.estimated_cost}
            </span>
          )}
        </div>
      </div>
      {(activity.category || activity.type) && (
        <span
          className="tr-activity-badge"
          style={{
            background: style.bg,
            color: style.color,
            border: `1px solid ${style.border}`,
          }}
        >
          {activity.category || activity.type}
        </span>
      )}
    </div>
  );
}

// ── Day Card ──────────────────────────────────────────────────────────────────
function DayCard({ day, index }) {
  // Support both `activities` and `schedule` arrays from different API shapes
  const activities = day.activities || day.schedule || [];
  const theme = day.theme || day.title || day.summary || "";

  return (
    <div className="tr-day-card">
      <div className="tr-day-header">
        <span className="tr-day-label">
          {day.day || `Day ${index + 1}`}
        </span>
        {theme && <span className="tr-day-theme">{theme}</span>}
      </div>
      <div className="tr-activities-list">
        {activities.length > 0 ? (
          activities.map((act, i) => <ActivityItem key={i} activity={act} />)
        ) : (
          <p className="tr-no-activities">No activities listed for this day.</p>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TripResult() {
  const location = useLocation();
  const navigate = useNavigate();

  // ── Real data from API (passed via router state from TripPlanner) ──
  const locationData = location.state?.tripData;
  const storedData = JSON.parse(localStorage.getItem("tripData"));

  const tripData = locationData || storedData;

  // ── If no data, show a friendly "go back" prompt ──
  if (!tripData) {
    return (
      <>
        <Navbar />
        <div className="tp-page">
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
          <div className="tr-results-section">
            <div className="tr-overview-card tr-no-data">
              <span className="tr-no-data-icon">🗺️</span>
              <h2>No trip data found</h2>
              <p>Please fill in your trip preferences and generate a trip first.</p>
              <button
                className="tp-submit-btn tr-go-back-btn"
                onClick={() => navigate("/trip-plane")}
              >
                ✈ Plan My Trip
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Normalise API response fields ──────────────────────────────────────────
  // Handles multiple possible shapes from the backend
  const title =
    tripData.title ||
    tripData.trip_title ||
    tripData.itinerary?.title ||
    "Your Trip Itinerary";

  const description =
    tripData.description ||
    tripData.summary ||
    tripData.overview ||
    tripData.itinerary?.description ||
    "";

  const estimatedTotal =
    tripData.estimatedTotal ||
    tripData.estimated_total ||
    tripData.total_budget ||
    tripData.budget_summary?.total ||
    null;

  // Days array — try several possible keys
  const days =
    tripData.days ||
    tripData.itinerary?.days ||
    tripData.day_wise_plan ||
    tripData.plan ||
    [];

  return (
    <>
      <Navbar />
      <div className="tp-page">

        {/* ── Hero Header ── */}
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

        {/* ── Results ── */}
        <div className="tr-results-section">

          {/* Back link */}
          <button className="tr-back-btn" onClick={() => navigate("/trip-plane")}>
            ← Plan another trip
          </button>

          {/* Trip Overview Card */}
          <div className="tr-overview-card">
            {tripData.images && tripData.images.length > 0 && (
              <div className="tr-images">
                {tripData.images.map((img, i) => (
                  <img key={i} src={img} alt="trip" className="tr-img" />
                ))}
              </div>
            )}
            <h2 className="tr-trip-title">{title}</h2>
            {description && (
              <p className="tr-trip-desc">{description}</p>
            )}
            {estimatedTotal && (
              <div className="tr-estimated-total">
                <span className="tr-total-icon">💰</span>
                <span>
                  Estimated Total{" "}
                  <strong>₹{estimatedTotal}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Day-by-Day Itinerary */}
          {days.length > 0 ? (
            <div className="tr-itinerary">
              {days.map((day, i) => (
                <DayCard key={i} day={day} index={i} />
              ))}
            </div>
          ) : (
            <div className="tr-overview-card">
              <p className="tr-trip-desc" style={{ textAlign: "center" }}>
                No day-wise plan available in the response.
              </p>
              <pre className="tr-raw-json">
                {JSON.stringify(tripData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}