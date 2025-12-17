import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const menuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setUser(null); // clear user state
    navigate("/login");
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [user]);


  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-logo">CSCI2720 Project</Link>
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/events" className="nav-link">Event List</Link>
        <Link to={`/map${location.search}`} className="nav-link">Map</Link>
        <Link to="/favorites" className="nav-link">Favourite List</Link>
      </div>

      <div className="nav-right">
        <div className="theme-toggle-wrapper">
          <span className="theme-label">Dark mode</span>
          <button
            className={`theme-switch ${theme === "dark" ? "active" : ""}`}
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            <span className="switch-thumb" />
          </button>
        </div>

        {!user && (
          <div style={{ display: "flex", gap: 12 }}>
            <Link to="/login" className="nav-link">Log in</Link>
            <Link to="/register" className="nav-link">Sign up</Link>
          </div>
        )}

        {user && (
          <div className="profile-wrapper" ref={menuRef}>
            <div className="profile-icon" onClick={toggleMenu}>
              {user.username[0].toUpperCase()}
            </div>

            {menuOpen && (
              <div className="dropdown-menu">
                {user.role === "admin" && (
                  <>
                    <Link to="/AdminPanel" className="dropdown-item">Admin Panel</Link>
                  </>
                )}
                <button className="dropdown-item logout" onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
