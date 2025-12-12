import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-logo">CSCI2720 Project</Link>

        <Link to="/" className="nav-link">Home</Link>
        <Link to="/events" className="nav-link">Event List</Link>
        <Link to="/map" className="nav-link">Map</Link>
      </div>

      <div className="nav-right">
        <div className="profile-wrapper" ref={menuRef}>
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
