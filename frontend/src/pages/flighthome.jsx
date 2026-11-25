import { useState, useEffect } from "react";
import "../css/flighthome.css";
import Navbar from "./Navbar";
import AirportAutocomplete from "./AirportAutocomplete";
import axios from "axios";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate,useLocation } from "react-router-dom";

export default function FlightHome() {
  const [tripType, setTripType] = useState("oneway");
  const [departureDate, setDepartureDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [fromAirport, setFromAirport] = useState(null);
  const [toAirport, setToAirport] = useState([]);
  const [budget, setBudget] = useState("");
  const [searchMode, setSearchMode] = useState("normal");
  const [budgetDestinations, setBudgetDestinations] = useState([]);
  const [airportsMap, setAirportsMap] = useState({});
  const navigate = useNavigate();
  const location = useLocation();


  const handleDestinationClick = (cityName, airportCode) => {
    const from = {
      airport_name: "Ahmedabad Airport",
      airport_code: "AMD",
      city: "Ahmedabad"
    };

    const to = {
      airport_name: cityName + " Airport",
      airport_code: airportCode,
      city: cityName
    };

    setFromAirport(from);
    setToAirport([to]);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      return;
    }
    if (!fromAirport) {
      toast.error("Select From airport");
      return;
    }
    if (searchMode === "budget") {

      if (!budget) {
        toast.error("Enter budget");
        return;
      }

      try {
        const res = await axios.get(
          "http://127.0.0.1:8000/budget-destinations",
          {
            params: {
              source: fromAirport.airport_code,
              budget: budget,
              date: departureDate
                ? departureDate.toISOString().split("T")[0]
                : null
            }
          }
        );

        navigate("/budget-results", {
          state: {
            destinations: res.data,
            fromAirport,
            budget,
            departureDate
          }
        });

      } catch {
        toast.error("Failed to fetch destinations");
      }

      return;
    }
    if (toAirport.length === 0) {
      toast.error("Select at least one destination");
      return;
    }
    if (!departureDate) {
      toast.error("Please select a departure date");
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/search-flights",
        {
          source: fromAirport.airport_code,
          destinations: toAirport.map((a) => a.airport_code),
          start_date: departureDate.toLocaleDateString("en-CA"),
          end_date:
            tripType === "roundway" && returnDate
              ? returnDate.toLocaleDateString("en-CA")
              : null,
          budget: budget ? Number(budget) : null
        },

        { headers: { Authorization: `Bearer ${token}` } }

      );
      navigate("/flight-result", {
        state: {
          flights: response.data.flights,
          summary: response.data.summary,
          message: response.data.message,
          date_prices: response.data.date_prices,
          fromAirport,
          toAirport,
          departureDate,
          returnDate,
          tripType
        }
      });

    } catch (error) {
      console.log("Search Error:", error);
      toast.error("Failed to fetch flights");
    }
  };

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/airports")
      .then(res => {
        const map = {};
        res.data.forEach(a => {
          map[a.airport_code] = a;
        });
        setAirportsMap(map);
      })
      .catch(err => console.log(err));
  }, []);

  useEffect(() => {
  if (location.state && Object.keys(airportsMap).length > 0) {

    const { source, destinations, start_date, end_date } = location.state;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // remove time

    // FROM
    if (source && airportsMap[source]) {
      setFromAirport(airportsMap[source]);
    }

    // TO
    if (destinations) {
      const destArray = destinations
        .split(",")
        .map(code => airportsMap[code.trim()])
        .filter(Boolean);

      setToAirport(destArray);
    }

    // ✅ DATE VALIDATION
    if (start_date) {
      const start = new Date(start_date);

      if (start >= today) {
        setDepartureDate(start);
      } else {
        setDepartureDate(null); // ❌ don't use old date
      }
    }

    if (end_date) {
      const end = new Date(end_date);

      if (end >= today) {
        setReturnDate(end);
        setTripType("roundway");
      } else {
        setReturnDate(null);
        setTripType("oneway");
      }
    } else {
      setTripType("oneway");
    }
  }
}, [location.state, airportsMap]);

  const handleQuickSearch = (code) => {
    if (!airportsMap[code] || !airportsMap["AMD"]) {
      toast.error("Loading airports...");
      return;
    }

    setFromAirport(airportsMap["AMD"]);
    setToAirport([airportsMap[code]]);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Navbar />
      <div className="hero">
        <div className="hero-content">
          <h1 className="font-heading font-extrabold text-4xl md:text-6xl text-primary-foreground mb-4 leading-tight">
            {toAirport.length > 0 ? (
              `Cheap flights to ${toAirport[0].city}`
            ) : (
              <>
                Find Your Cheapest <br /> Flight Today
              </>
            )}
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl max-w-xl mx-auto">
            Compare prices from 500+ airlines and see the perfect trip at under Budget.
          </p>

          <div className="trip-type">
            <select value={tripType} onChange={(e) => setTripType(e.target.value)}>
              <option value="oneway">One Way</option>
              <option value="roundway">Round Way</option>
            </select>
            <label className="budget-inline">
              <input
                type="checkbox"
                checked={searchMode === "budget"}
                onChange={(e) =>
                  setSearchMode(e.target.checked ? "budget" : "normal")
                }
              />
              Explore with Budget
            </label>
          </div>

          <div className="search-box">
            {/* FROM */}
            <div className="input-group">
              <label className="field-label">From</label>
              <AirportAutocomplete
                placeholder="Country, city or airport"
                className="autocomplete-input"
                value={fromAirport}
                onSelect={(airport) => setFromAirport(airport)}
                isMulti={false}
              />
            </div>

            {/* TO */}
            {searchMode === "normal" && (
              <div className="input-group">
                <label className="field-label">To</label>
                <AirportAutocomplete
                  placeholder="Country, city or airport"
                  value={toAirport}
                  className="autocomplete-input"
                  onSelect={(airport) =>
                    setToAirport((prev) => [...prev, airport])
                  }
                  isMulti={true}
                />
              </div>
            )}

            {/* DEPART */}
            <div className="input-group datepicker-wrapper">
              <label className="field-label">Depart</label>
              <DatePicker
                selected={departureDate}
                onChange={(date) => setDepartureDate(date)}
                minDate={new Date()}
                placeholderText="Add date"
                className="custom-date-input"
                dateFormat="dd/MM/yyyy"
              />
            </div>


            {/* RETURN */}
            {tripType === "roundway" && (
              <div className="input-group datepicker-wrapper">
                <label className="field-label">Return</label>
                <DatePicker
                  selected={returnDate}
                  onChange={(date) => setReturnDate(date)}
                  minDate={departureDate || new Date()}
                  placeholderText="Add Date"
                  className="custom-date-input"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            )}
            <div className="input-group">
              <label className="field-label">Budget</label>
              <input
                type="text"
                placeholder="Enter amount"
                className="budget-input"
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            <button onClick={handleSearch}>Search</button>
          </div>

        </div>
      </div >
      <section className="popular-section">
        <h1 className="section-title">Explore popular flights</h1>

        <div className="popular-wrapper">
          <h3 className="popular-box-title">
            Flights to top cities from India
          </h3>
          <div className="popular-grid">
            {["BDQ", "STV","HSR", "BOM", "DEL", "JAI", "CCU", "BLR", "MAA","PNQ","BHO","SLV"].map((code) => {
              const airport = airportsMap[code];

              return (
                <div
                  key={code}
                  className="popular-card"
                  onClick={() => handleQuickSearch(code)}
                >
                  <h3>{airport?.city || code}</h3>
                  <p>Explore flights</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="features-section">

        <h2 className="features-title">Why Choose CheapFlights</h2>

        <div className="features-grid">

          <div className="feature-card">
            <div className="feature-icon">✈</div>
            <h3>Cheapest Flight Finder</h3>
            <p>Compare flight prices from multiple airlines and find the best deal instantly.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Budget Based Search</h3>
            <p>Enter your travel budget and discover flights that match your price range.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Popular Destinations</h3>
            <p>Explore famous tourist places near your destination city after searching flights.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast Flight Results</h3>
            <p>Get instant flight results with our optimized search technology.</p>
          </div>

        </div>
      </section>

      <section className="destinations-section">
        <h2 className="section-title">Popular Destinations</h2>

        <div className="destinations-grid">

          <div className="destination-card" onClick={() => handleDestinationClick("Chennai", "MAA")}>
            <img src="https://media.istockphoto.com/id/1226340114/photo/puratchi-thalaivar-dr-mgr-central-railway-station-chennai-central-railway-station-india.jpg?s=612x612&w=0&k=20&c=lZjBnWBBoLiApWZUUWP1Vl3XAVdKjYMcgGpItXv_L14=" />
            <h3>chennai </h3>
            <p>From Ahmedabad</p>
          </div>

          <div className="destination-card" onClick={() => handleDestinationClick("Jaipur", "JAI")}>
            <img src="https://media.istockphoto.com/id/1476114600/photo/hawa-mahal-palace-or-palace-of-the-winds-in-jaipur-rajasthan-state-in-india.jpg?s=612x612&w=0&k=20&c=N0bISZf0ZuAPTQOvmJFqhoTQqEe4glEwwNMvgKEaRuU=" />
            <h3>Jaipur</h3>
            <p>From Ahmedabad</p>
          </div>

          <div className="destination-card" onClick={() => handleDestinationClick("New Delhi", "DEL")}>
             <img src="https://cdn.pixabay.com/photo/2020/02/02/17/24/travel-4813658_640.jpg" />
            <h3>Delhi</h3>
            <p>From Ahmedabad</p>
          </div>

        </div>
      </section>
    </>
  );
}