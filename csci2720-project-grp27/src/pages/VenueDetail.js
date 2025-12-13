import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";

// Fix Leaflet default icon issue
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function VenueDetail() {
  const { venueId } = useParams();
  const [venue, setVenue] = useState(null);
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
        const res = await fetch(`http://localhost:5001/api/venues/${venueId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Request failed (${res.status})`);
        }

        const data = await res.json();
        if (!cancelled) setVenue(data.venue);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e.message || "Failed to load venue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [venueId]);

  if (loading) return <div style={{ padding: 20 }}>Loading venue…</div>;
  if (error) return <div style={{ padding: 20 }}>Error: {error}</div>;
  if (!venue) return <div style={{ padding: 20 }}>Venue not found.</div>;

  const lat = Number(venue.latitude);
  const lng = Number(venue.longitude);

  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <div style={{ padding: 20 }}>
      <Link to="/">← Back</Link>

      <h2>{venue.name}</h2>
      <p><strong>ID:</strong> {venue.id}</p>

      {!hasCoords ? (
        <p>No location data available.</p>
      ) : (
        <MapContainer
          center={[lat, lng]}
          zoom={16}
          scrollWheelZoom={true}
          style={{
            height: "400px",
            width: "100%",
            marginTop: "20px",
            borderRadius: "8px",
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap & Stadia Maps'
            url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png"
          />

          <Marker position={[lat, lng]}>
            <Popup>
              <strong>{venue.name}</strong>
            </Popup>
          </Marker>
        </MapContainer>
      )}
    </div>
  );
}
