import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./VenueList.css";

export default function VenueList() {
  const [venues, setVenues] = useState([]);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");


  useEffect(() => {
    fetch("http://localhost:5050/api/venues")  // Adjust PORT if necessary, should be same as server/.env
      .then((res) => res.json())
      .then((data) => setVenues(data))
      .catch((err) => console.error("Failed to fetch venues:", err));
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

  return (
    <div className="venue-page">
      <h2 className="title">All Venues</h2>

      <table className="venue-table">
        <thead>
          <tr>
            <th>ID</th>
            <th onClick={() => sortVenues("name")} className="sortable">
              Location {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
            </th>
            <th>Distance</th>
          </tr>
        </thead>

        <tbody>
          {venues.map((v) => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>
                <Link className="venue-link" to={`/location/${v.id}`}>
                  {v.name}
                </Link>
              </td>
              <td>{v.area || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="last-updated">
        Last updated: {new Date().toLocaleString()}
      </p>
    </div>
  );
}
