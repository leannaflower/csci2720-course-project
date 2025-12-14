import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./pages/Navbar";
import VenueList from "./pages/VenueList";
import VenueDetail from "./pages/VenueDetail";
import Map from "./pages/Map";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import Favorites from "./pages/Favorites";

export default function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />

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