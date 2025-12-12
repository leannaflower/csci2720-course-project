import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Map from "./pages/Map";
import Navbar from "./pages/Navbar";
import VenueList from "./pages/VenueList";


export default function App() {
  const user = {
    username: "test",
    role: "admin" // or "user"
  };

  return (
    <Router>
      <Navbar user={user} />

      <Routes>
        {/* Home */}
        <Route path="/" element={<VenueList />} />

        {/* Map.js */}
        <Route path="/map" element={<Map />} />

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div style={{ padding: "20px" }}>
              <h2>404 - Page Not Found</h2>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
