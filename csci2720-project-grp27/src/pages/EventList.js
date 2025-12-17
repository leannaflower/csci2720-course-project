import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./EventList.css";

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      if (!token) {
        setError("No token found. Please log in again.");
        setLoading(false);
        return;
      }
      
      try {
        // Fetch venues
        const vRes = await fetch(`http://localhost:5001/api/venues`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          credentials: "include",
        });
        if (!vRes.ok) throw new Error(await vRes.text());
        
        const venuesData = await vRes.json();
        
        // Create mapping of venue id -> venue name
        const venuesMap = {};
        venuesData.forEach(venue => {
          venuesMap[venue.id] = venue.name || "Unknown Venue";
        });
        
        if (!cancelled) setVenues(venuesMap);
        
        // Fetch events
        const eRes = await fetch(`http://localhost:5001/api/events`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          credentials: "include",
        });
        if (!eRes.ok) throw new Error(await eRes.text());
        
        const data = await eRes.json();
        const eventsList = Array.isArray(data.items) ? data.items : [];
        
        if (!cancelled) setEvents(eventsList);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e.message || "Failed to load events");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <div className="loading">Loading events...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="event-page">
      <h2 className="title">All Events</h2>

      {events.length === 0 ? (
        <div className="no-events">No events found.</div>
      ) : (
        <>
          <table className="event-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Venue</th>
                <th>Date</th>
                <th>Description</th>
                <th>Presenter</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const venueName = venues[event.venueid] || "Unknown";
                return (
                  <tr key={event.id}>
                    <td>{event.id}</td>
                    <td className="event-title-cell">{event.title}</td>
                    <td className="venue-cell">
                        <Link className="venue-link" to={`/location/${event.venueid}`}>
                            {venueName}
                        </Link>
                      <span className="venue-id">ID: {event.venueid}</span>
                    </td>
                    <td className="date-cell">{event.date}</td>
                    <td className="description-cell">
                      <div>{event.description || "N/A"}</div>
                    </td>
                    <td className="presenter-cell">{event.presenter || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}