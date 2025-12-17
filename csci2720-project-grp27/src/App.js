import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import Navbar from "./pages/Navbar";
import VenueList from "./pages/VenueList";
import VenueDetail from "./pages/VenueDetail";
import Map from "./pages/Map";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import Favorites from "./pages/Favorites";
import Register from "./pages/Register";

import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5001/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data))
      .catch(() => setUser(null));
  }, []);

  return (
    <Router>
      <Navbar user={user} setUser={setUser}/>

      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <VenueList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/location/:venueId"
          element={
            <ProtectedRoute>
              <VenueDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <Map />
            </ProtectedRoute>
          }
        />
		
		<Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
