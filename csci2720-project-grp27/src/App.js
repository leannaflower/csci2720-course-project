import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Map from "./Map";
import Navbar from "./Navbar";

export default function App() {
  const user = {
      username: "test",
      role: "admin" // or "user"
    };
  
  return (
    <Router>
      <Navbar user="test" />

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

