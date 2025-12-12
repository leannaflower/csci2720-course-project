import React, { useEffect, useState } from "react";
import "./VenueList.css";

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


export default function VenueList() {
  const [venues, setVenues] = useState([]);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [maxDistance, setMaxDistance] = useState(50);


  useEffect(() => {
  fetch("http://localhost:5050/api/venues")  // Adjust PORT if necessary, should be same as server/.env
    .then((res) => res.json())
    .then((data) => {

      const CUHK = { lat: 22.4163, lng: 114.2100 };

      const withDistances = data.map(v => {
        if (v.latitude && v.longitude) {
          v.distanceFromCUHK = distanceKm(
            CUHK.lat, CUHK.lng,
            v.latitude, v.longitude
          );
        } else {
          v.distanceFromCUHK = Infinity;
        }
        return v;
      });

      setVenues(withDistances);
    })
    .catch(err => console.error("Failed to fetch venues:", err));
}, []);


  const sortVenues = (field) => {
    const order = field === sortField && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);

    const sorted = [...venues].sort((a, b) => {
      if (a[field] < b[field]) return order === "asc" ? -1 : 1;
      if (a[field] > b[field]) return order === "asc" ? 1 : -1;
      return 0;
    });

    setVenues(sorted);
  };

  const filteredVenues = venues.filter(v =>
    v.distanceFromCUHK <= maxDistance
    );

  return (
  <div className="venue-page">
    <h2 className="title">All Venues</h2>

    <div className="filter-panel">
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
    </div>

    <table className="venue-table">
      <thead>
        <tr>
          <th>ID</th>
          <th
            onClick={() => sortVenues("name")}
            className="sortable"
          >
            Location {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
          </th>
          <th>Distance (from CUHK)</th>
        </tr>
      </thead>

      <tbody>
        {filteredVenues.map((v) => (
          <tr key={v.id}>
            <td>{v.id}</td>
            <td>{v.name}</td>
            <td>{v.distanceFromCUHK.toFixed(2)} km</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  );
}
