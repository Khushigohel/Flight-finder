import "../css/FlightLoader.css";
import plane from "../assets/flight.jpg";   // airplane image

export default function Loader() {
  return (
    <div className="loader-wrapper">

      <div className="progress-bar"></div>

      <div className="loader-center">

        <div className="plane-container">
          <div className="line-loader"></div>

          <img
            src={plane}
            alt="plane"
            className="plane-icon-loader"
          />
        </div>

        <p className="loader-text">
          Hold on, we're fetching flights for you
        </p>

      </div>

    </div>
  );
}