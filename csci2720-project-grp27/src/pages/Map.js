import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import { useSearchParams, Link } from "react-router-dom";

import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get("keyword") || "";
  const area = searchParams.get("area") || "All";
  const maxDistance = Number(searchParams.get("maxDistance") || 40);
  const includeUnknownDistance = (searchParams.get("includeUnknownDistance") || "true") === "true";

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    const v = String(value);
    if (v === "" || v === "All") next.delete(key);
    else next.set(key, v);
    setSearchParams(next);
  }

  const [venues, setVenues] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredVenues = useMemo(() => {
    const CUHK = { lat: 22.4163, lng: 114.21 };

    const withData = venues.map((v) => {
      const lat = typeof v.latitude === "string" ? Number(v.latitude) : v.latitude;
      const lng = typeof v.longitude === "string" ? Number(v.longitude) : v.longitude;
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

      let dist = null;
      if (hasCoords) {
        const d = distanceKm(CUHK.lat, CUHK.lng, lat, lng);
        dist = Number.isFinite(d) ? d : null;
      }

      return {
        ...v,
        latitude: hasCoords ? lat : null,
        longitude: hasCoords ? lng : null,
        distanceFromCUHK: dist,
        area: hasCoords ? getArea(lat, lng) : "Unknown",
      };
    });

    return withData.filter((v) => {
      const matchesKeyword = (v.name || "").toLowerCase().includes(keyword.toLowerCase());
      const matchesArea = area === "All" || v.area === area;

      const dist = v.distanceFromCUHK;
      const isUnknownDist = dist == null || !Number.isFinite(dist);
      const matchesDistance = isUnknownDist ? includeUnknownDistance : dist <= maxDistance;

      return matchesKeyword && matchesArea && matchesDistance;
    });
  }, [venues, keyword, area, includeUnknownDistance, maxDistance]);


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

      <div className="filter-panel" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search location…"
          value={keyword}
          onChange={(e) => updateParam("keyword", e.target.value)}
          className="filter-search"
        />

        <label className="filter-label">Area:</label>
        <select value={area} onChange={(e) => updateParam("area", e.target.value)} className="area-dropdown">
          <option value="All">All</option>
          <option value="Kowloon">Kowloon</option>
          <option value="Hong Kong Island">Hong Kong Island</option>
          <option value="New Territories">New Territories</option>
          <option value="Unknown">Unknown</option>
        </select>

        <label className="filter-label">Distance (km): </label>
        <input
          type="range"
          min="1"
          max="50"
          value={maxDistance}
          onChange={(e) => updateParam("maxDistance", Number(e.target.value))}
          className="distance-slider"
        />
        <span className="filter-value">{maxDistance} km</span>

        <label style={{ marginLeft: 12 }}>
          <input
            type="checkbox"
            checked={includeUnknownDistance}
            onChange={(e) => updateParam("includeUnknownDistance", e.target.checked)}
          />{" "}
          Include unknown distance
        </label>
      </div>

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

        <FitBounds venues={filteredVenues} />

        {filteredVenues
          .filter(v => Number.isFinite(v.latitude) && Number.isFinite(v.longitude))
          .map(v => (
            <Marker key={v.id} position={[v.latitude, v.longitude]}>
              <Popup>
                <strong>{v.name}</strong>
                <br />
                <Link to={`/location/${v.id}`}>View details</Link>
              </Popup>
            </Marker>
          ))}

      </MapContainer>
    </div>
  );
}
