import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-logo">CSCI2720 Project</Link>

        <Link to="/" className="nav-link">Home</Link>
        <Link to="/locations" className="nav-link">Location List</Link>
        <Link to="/events" className="nav-link">Event List</Link>
        <Link to="/map" className="nav-link">Map</Link>
      </div>

      <div className="nav-right">
        <div className="profile-wrapper">
          <div className="profile-icon" onClick={toggleMenu}>
            {user?.username?.[0]?.toUpperCase() || "A"}
          </div>

          {menuOpen && (
            <div className="dropdown-menu">
              {user?.role === "admin" && (
                <>
                  <Link to="/admin/users" className="dropdown-item">User Manager</Link>
                  <Link to="/admin/events" className="dropdown-item">Event Manager</Link>
                </>
              )}

              <Link to="/profile" className="dropdown-item">Profile</Link>
              <button className="dropdown-item logout" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
