import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

export default function RandomEvents() {
  const [venues, setVenues] = useState([]);
  const [venueid, setVenueid] = useState("");
  const [events, setEvents] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [openIds, setOpenIds] = useState(() => new Set()); 

  const token = localStorage.getItem("token");

  useEffect(() => {
    let active = true;
    async function loadVenues() {
      setLoadingVenues(true);
      setErr("");
      try {
        const res = await fetch("http://localhost:5001/api/venues", {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load venues, please try logging in again");
        const data = await res.json();
        if (active) setVenues(data || []);
      } catch (e) {
        if (active) setErr(e.message || "Failed to load venues, please try logging in again");
      } finally {
        if (active) setLoadingVenues(false);
      }
    }
    loadVenues();
    return () => { active = false; };
  }, [token]);

  async function getRandom() {
    setLoading(true);
    setErr("");
    setEvents([]);
    setOpenIds(new Set());
    try {
      const params = new URLSearchParams();
      if (venueid) params.set("venueid", venueid);
      const res = await fetch(`http://localhost:5001/api/events/random?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch random events");
      }
      const data = await res.json();
      setEvents(data.items || []);
    } catch (e) {
      setErr(e.message || "Failed to fetch random events");
    } finally {
      setLoading(false);
    }
  }

  function toggleOpen(id) {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>Random Event Picker</h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <label htmlFor="venue" style={{ fontWeight: 600 }}>
          Filter by venue:
        </label>
        <select
          id="venue"
          value={venueid}
          onChange={(e) => setVenueid(e.target.value)}
          disabled={loadingVenues}
          style={{ padding: "6px 8px", minWidth: 220 }}
        >
          <option value="">All venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} {typeof v.eventCount === "number" ? `(${v.eventCount})` : ""}
            </option>
          ))}
        </select>

        <button
          onClick={getRandom}
          disabled={loading || loadingVenues}
          style={{
            padding: "8px 12px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            opacity: loading || loadingVenues ? 0.7 : 1,
          }}
        >
          {loading ? "Picking…" : "Surprise me"}
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}

      {events.length === 0 && !loading && (
        <div style={{ color: "#666" }}>No random events to show yet. Click “Surprise me” to get 3 random events you might be interested in.</div>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
        {events.map((ev) => {
          const isOpen = openIds.has(ev.id);
          return (
            <li
              key={ev.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
                background: "var(--dropdown-bg)",
              }}
            >
              <button
                type="button"
                onClick={() => toggleOpen(ev.id)}
                aria-expanded={isOpen}
                aria-controls={`desc-${ev.id}`}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 12,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-color)", fontSize: "1.2em" }}>{ev.title}</div>
                  <div style={{ color: "var(--text-color)", marginTop: 4 }}>
                    {ev.venueName || ev.venueid} • {ev.date}
                  </div>
                  {ev.presenter && (
                    <div style={{ color: "var(--text-color)", marginTop: 4 }}>Presenter: {ev.presenter}</div>
                  )}
                </div>
                <span
                  aria-hidden="true"
                  style={{
                    marginLeft: 12,
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.15s linear",
                  }}
                >
                  ▼
                </span>
              </button>

              <div
                id={`desc-${ev.id}`}
                style={{
                  maxHeight: isOpen ? 600 : 0,
                  transition: "max-height 0.2s ease",
                  overflow: "hidden",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <div style={{ padding: 12, color: "var(--text-color)", whiteSpace: "pre-wrap" }}>
                  {ev.description ? ev.description : "No description available."}
                </div>
                <div style={{ padding: "0 12px 12px" }}>
                  <Link to={`/location/${ev.venueid}`}>Venue details</Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}