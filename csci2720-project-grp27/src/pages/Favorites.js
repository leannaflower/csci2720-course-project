import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

//same helper functions as those in VenueList.js, might consider separating these into a util.js file if time permits?
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

export default function Favorites() {
  const [rows, setRows] = useState([]); // [{ favoriteId, id, name, distanceFromCUHK, eventCount, latitude, longitude }]
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState({});
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const token = localStorage.getItem("token");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        if (!token) throw new Error("No token found. Please log in.");

        const fRes = await fetch(`http://localhost:5001/api/favorites?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          credentials: "include",
        });
        if (!fRes.ok) throw new Error(await fRes.text());
        const favs = await fRes.json(); // [{ _id, venueId }]

        if (favs.length === 0) {
          if (!cancelled) setRows([]);
          return;
        }

        const venuePromises = favs.map((f) =>
          fetch(`http://localhost:5001/api/venues/${encodeURIComponent(f.venueId)}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            credentials: "include",
          })
            .then(async (r) => {
              if (!r.ok) throw new Error(await r.text());
              return r.json();
            })
            .then((data) => ({ favoriteId: f._id, venue: data.venue, eventCount: data.events.length }))
        );

        const settled = await Promise.allSettled(venuePromises);
        const CUHK = { lat: 22.4163, lng: 114.21 };

        const mapped = settled
          .filter((s) => s.status === "fulfilled" && s.value?.venue)
          .map((s) => {
            const { favoriteId, venue, eventCount } = s.value;
            const lat = typeof venue.latitude === "string" ? Number(venue.latitude) : venue.latitude;
            const lng = typeof venue.longitude === "string" ? Number(venue.longitude) : venue.longitude;
            const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
            const dist = hasCoords ? distanceKm(CUHK.lat, CUHK.lng, lat, lng) : null;

            return {
              favoriteId,
              id: venue.id,
              name: venue.name,
              latitude: hasCoords ? lat : null,
              longitude: hasCoords ? lng : null,
              distanceFromCUHK: Number.isFinite(dist) ? dist : null,
              eventCount,
            };
          });

        if (!cancelled) setRows(mapped);
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr(e.message || "Failed to load favourites");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function sortBy(field) {
    const nextOrder = field === sortField && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(nextOrder);
  }

  const sortedRows = useMemo(() => {
    const dir = sortOrder === "asc" ? 1 : -1;
    const arr = [...rows];
    return arr.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];

      const aNull = av == null || Number.isNaN(av);
      const bNull = bv == null || Number.isNaN(bv);
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;

      if (typeof av === "string") return dir * av.localeCompare(bv);
      return dir * (av - bv);
    });
  }, [rows, sortField, sortOrder]);

  async function removeFav(favoriteId) {
    if (!token) return;
    if (busy[favoriteId]) return;

    setBusy((b) => ({ ...b, [favoriteId]: true }));
    const prev = rows;
    setRows((arr) => arr.filter((x) => x.favoriteId !== favoriteId));

    try {
      const res = await fetch(`http://localhost:5001/api/favorites/${favoriteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      console.error(e);
      alert("Failed to remove favourite");
      setRows(prev);
    } finally {
      setBusy((b) => ({ ...b, [favoriteId]: false }));
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading favourites…</div>;
  if (err) return <div style={{ padding: 20 }}>Error: {err}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>My Favourite Venues</h2>

      {sortedRows.length === 0 ? (
        <div>No favourites yet. Go to the Venues page and add some.</div>
      ) : (
        <table className="venue-table">
          <thead>
            <tr>
              <th>ID</th>
              <th
                onClick={() => sortBy("name")}
                className="sortable"
                style={{ cursor: "pointer" }}
                title="Sort by name"
              >
                Location {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                onClick={() => sortBy("distanceFromCUHK")}
                className="sortable"
                style={{ cursor: "pointer" }}
                title="Sort by distance"
              >
                Distance (from CUHK) {sortField === "distanceFromCUHK" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                onClick={() => sortBy("eventCount")}
                className="sortable"
                style={{ cursor: "pointer" }}
                title="Sort by number of events"
              >
                # Events {sortField === "eventCount" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
              <th style={{ textAlign: "right" }}>Remove</th>
            </tr>
          </thead>

          <tbody>
            {sortedRows.map((r) => (
              <tr key={r.favoriteId}>
                <td>{r.id}</td>
                <td>
                  <Link className="venue-link" to={`/location/${r.id}`}>
                    {r.name}
                  </Link>
                </td>
                <td>{r.distanceFromCUHK == null ? "N/A" : `${r.distanceFromCUHK.toFixed(2)} km`}</td>
                <td>{r.eventCount}</td>
                <td style={{ textAlign: "right" }}>
                  <button
                    onClick={() => removeFav(r.favoriteId)}
                    disabled={!!busy[r.favoriteId]}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "none",
                      background: "#4763ff",
                      color: "#fff",
                      cursor: busy[r.favoriteId] ? "default" : "pointer",
                    }}
                    title="Remove from favourites"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}