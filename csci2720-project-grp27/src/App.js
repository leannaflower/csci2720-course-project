import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Map from "./Map";

export default function App() {
  return (
    <Router>
      <div style={{ padding: "15px", background: "#eee" }}>
        <nav style={{ display: "flex", gap: "15px" }}>
          <Link to="/">Home</Link>
          <Link to="/map">Map</Link>
        </nav>
      </div>

      <Routes>
        {/* Home */}
        <Route path="/" element={<div style={{ padding: "20px" }}><h2>Home</h2></div>} />

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
