import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

import L from "leaflet";

const redPin = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/red.png",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});


export default function Map() {
  const [venues, setVenues] = useState([]);
  
  useEffect(() => {
    fetch("http://localhost:5000/api/venues")  // Adjust PORT if necessary, should be same as server/.env
      .then((res) => res.json())
      .then((data) => setVenues(data))
      .catch((err) => console.error("Failed to fetch venues", err));
  }, []);

  // Default center of Hong Kong
  const hkCenter = [22.3193, 114.1694];

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

        {venues
          .filter((v) => v.latitude && v.longitude)
          .map((venue) => (
            <Marker
                key={venue.id}
                position={[venue.latitude, venue.longitude]}
                icon={redPin}
                >
              <Popup>
                <strong>{venue.name}</strong>
                <br />
                <a href={`/location/${venue.id}`}>View details</a>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
