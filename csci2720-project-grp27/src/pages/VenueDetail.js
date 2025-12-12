import React from "react";
import { useParams, Link } from "react-router-dom";

export default function VenueDetail() {
  const { venueId } = useParams();

  return (
    <div style={{ padding: 20 }}>
      <Link to="/">← Back</Link>
      <h2>Venue Detail</h2>
      <p>Venue ID: {venueId}</p>
    </div>
  );
}