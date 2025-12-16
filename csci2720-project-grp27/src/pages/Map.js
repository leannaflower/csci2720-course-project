import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";

import L from "leaflet";

// Fix default Leaflet icon issue
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function FitBounds({ venues }) {
  const map = useMap();

  const points = useMemo(() => {
    return venues
      .map(v => [Number(v.latitude), Number(v.longitude)])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
  }, [venues]);

  useEffect(() => {
    if (points.length === 0) return;

    map.fitBounds(points, {
      padding: [30, 30],
    });
  }, [map, points]);

  return null;
}

export default function Map() {
  const [venues, setVenues] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
        const url = `http://localhost:5001/api/venues?t=${Date.now()}`;

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

        // Backend returns ARRAY
        const list = Array.isArray(data) ? data : [];

        const withCoords = list.filter(v =>
          Number.isFinite(Number(v.latitude)) && Number.isFinite(Number(v.longitude))
        );

        console.log("venues total:", list.length);
        console.log("venues with coords:", withCoords.length);
        console.table(list.map(v => ({ id: v.id, name: v.name, lat: v.latitude, lng: v.longitude })));


        if (!cancelled) setVenues(list);
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

  // Default center of Hong Kong
  const hkCenter = [22.3193, 114.1694];

  if (loading) return <div style={{ padding: 20 }}>Loading map…</div>;
  if (error) return <div style={{ padding: 20 }}>Error: {error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>All Venues on Map</h2>

      <MapContainer
        center={hkCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "600px", width: "100%", borderRadius: "8px" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap & Stadia Maps'
          url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png"
        />

        <FitBounds venues={venues} />

        {venues
          .filter(v =>
            Number.isFinite(Number(v.latitude)) &&
            Number.isFinite(Number(v.longitude))
          )
          .map(v => (
            <Marker
              key={v.id}
              position={[Number(v.latitude), Number(v.longitude)]}
            >
              <Popup>
                <strong>{v.name}</strong>
                <br />
                <a href={`/location/${v.id}`}>View details</a>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
