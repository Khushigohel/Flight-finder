import { Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import FlightHome from "./pages/flighthome";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Registration from "./pages/registration";
import VerifyOtp from "./pages/VerifyOtp";
import Flight_history from "./pages/Flight_history";
import FlightResults from "./pages/FlightResults";
import NotFound from "./pages/NotFound";
import BudgetResults from "./pages/BudgetResults";
import ForgotPassword from "./pages/Forgotpassword";
import ResetPassword from "./pages/ResetPassword";
import FlightChatbot from "./pages/FlightChatbot";
import TripPlanner from "./pages/TripPlanner";
import TripResult from "./pages/TripResult";


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<FlightHome />} />
        <Route path="/flight-result" element={<FlightResults />} />
        <Route path="/budget-results" element={<BudgetResults />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/history" element={<Flight_history />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/chat-ai" element={<FlightChatbot/>}/>
        <Route path="/trip-plane" element={<TripPlanner/>}/>
        <Route path="/trip-result" element={<TripResult/>}/>


          <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;