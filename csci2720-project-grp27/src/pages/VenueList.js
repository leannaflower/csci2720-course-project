import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./VenueList.css";

function getArea(lat, lng) {
  if (lat >= 22.23 && lat <= 22.33 && lng >= 114.12 && lng <= 114.20) return "Hong Kong Island";
  if (lat >= 22.29 && lat <= 22.34 && lng >= 114.15 && lng <= 114.20) return "Kowloon";
  if (lat > 22.34) return "New Territories";
  return "Unknown";
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function VenueList() {
  const [venues, setVenues] = useState([]);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const [maxDistance, setMaxDistance] = useState(40);
  const [keyword, setKeyword] = useState("");
  const [area, setArea] = useState("All");
  const [availableAreas] = useState(["All", "Kowloon", "Hong Kong Island", "New Territories", "Unknown"]);
  const [includeUnknownDistance, setIncludeUnknownDistance] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        // cache-bust to avoid 304 + empty body problems
        const url = `http://localhost:5000/api/venues?t=${Date.now()}`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Request failed (${res.status})`);
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        const CUHK = { lat: 22.4163, lng: 114.21 };

        const withData = list.map((v) => {
          // Make sure lat/lng are real numbers
          const lat = typeof v.latitude === "string" ? Number(v.latitude) : v.latitude;
          const lng = typeof v.longitude === "string" ? Number(v.longitude) : v.longitude;

          const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

          let dist = null;
          if (hasCoords) {
            const d = distanceKm(CUHK.lat, CUHK.lng, lat, lng);
            dist = Number.isFinite(d) ? d : null; // treat NaN as unknown
          }

          return {
            ...v,
            latitude: hasCoords ? lat : null,
            longitude: hasCoords ? lng : null,
            distanceFromCUHK: dist,
            area: hasCoords ? getArea(lat, lng) : "Unknown",
            eventCount: v.eventCount ?? 0,
          };
        });

        if (!cancelled) setVenues(withData);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e.message || "Failed to load venues");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortVenues = (field) => {
    const order = field === sortField && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);

    const dir = order === "asc" ? 1 : -1;

    const sorted = [...venues].sort((a, b) => {
      const av = a[field];
      const bv = b[field];

      // null/undefined go last
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "string") return dir * av.localeCompare(bv);
      return dir * (av - bv);
    });

    setVenues(sorted);
  };

  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      const matchesKeyword = (v.name || "").toLowerCase().includes(keyword.toLowerCase());
      const matchesArea = area === "All" || v.area === area;

      const dist = v.distanceFromCUHK;
      const isUnknownDist = dist == null || !Number.isFinite(dist);
      const matchesDistance = isUnknownDist ? includeUnknownDistance : dist <= maxDistance;

      return matchesKeyword && matchesArea && matchesDistance;
    });
  }, [venues, keyword, area, includeUnknownDistance, maxDistance]);

  if (loading) return <div className="venue-page" style={{ padding: 20 }}>Loading venues…</div>;
  if (error) return <div className="venue-page" style={{ padding: 20 }}>Error: {error}</div>;

  return (
    <div className="venue-page">
      <h2 className="title">All Venues</h2>

      <div className="filter-panel">
        <input
          type="text"
          placeholder="Search location…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="filter-search"
        />

        <label className="filter-label">Area:</label>
        <select value={area} onChange={(e) => setArea(e.target.value)} className="area-dropdown">
          {availableAreas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <label className="filter-label">Distance (km): </label>
        <input
          type="range"
          min="1"
          max="50"
          value={maxDistance}
          onChange={(e) => setMaxDistance(Number(e.target.value))}
          className="distance-slider"
        />
        <span className="filter-value">{maxDistance} km</span>

        <label style={{ marginLeft: 12 }}>
          <input
            type="checkbox"
            checked={includeUnknownDistance}
            onChange={(e) => setIncludeUnknownDistance(e.target.checked)}
          />{" "}
          Include unknown distance
        </label>
      </div>

      {filteredVenues.length === 0 ? (
        <div style={{ padding: 12 }}>No venues match your filters (try increasing distance or clearing search).</div>
      ) : (
        <table className="venue-table">
          <thead>
            <tr>
              <th>ID</th>

              <th onClick={() => sortVenues("name")} className="sortable">
                Location {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>

              <th onClick={() => sortVenues("distanceFromCUHK")} className="sortable">
                Distance (from CUHK) {sortField === "distanceFromCUHK" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>

              <th onClick={() => sortVenues("eventCount")} className="sortable">
                # Events {sortField === "eventCount" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredVenues.map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>
                  <Link className="venue-link" to={`/location/${v.id}`}>
                    {v.name}
                  </Link>
                </td>
                <td>{v.distanceFromCUHK == null ? "N/A" : `${v.distanceFromCUHK.toFixed(2)} km`}</td>
                <td>{v.eventCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
