import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
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

  // comments feature!
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  const location = useLocation();


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

  // fetch comments for this venue
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setCommentLoading(true);
      setCommentError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setCommentError("No token found. Please log in again.");
        setCommentLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5001/api/comments/${venueId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        if (!cancelled) setComments(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setCommentError(e.message || "Failed to load comments");
      } finally {
        if (!cancelled) setCommentLoading(false);
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

  // submit handler to post a comment
  async function submitComment(e) {
    e.preventDefault();
    setPosting(true);
    setCommentError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setCommentError("No token found. Please log in again.");
      setPosting(false);
      return;
    }

    const text = commentText.trim();
    if (!text) {
      setCommentError("Comment cannot be empty.");
      setPosting(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/comments/${venueId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();

      setComments((prev) => [created, ...prev]);
      setCommentText("");
    } catch (e) {
      console.error(e);
      setCommentError(e.message || "Failed to post comment");
    } finally {
      setPosting(false);
    }
  }


  return (
    <div style={{ padding: 20 }}>
      <Link to={`/map${location.search}`}>← Back</Link>

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

      <section style={{ marginTop: 24 }}>
        <h3>Comments</h3>

        <form onSubmit={submitComment} style={{ marginBottom: 12 }}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            style={{ width: "100%", padding: 10, borderRadius: 8 }}
          />
          <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center" }}>
            <button type="submit" disabled={posting}>
              {posting ? "Posting..." : "Post comment"}
            </button>
            {commentError && <span style={{ color: "crimson" }}>{commentError}</span>}
          </div>
        </form>

        {commentLoading ? (
          <div>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div>No comments yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {comments.map((c) => (
              <div key={c._id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
                <div style={{ fontWeight: 600 }}>{c.username}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                </div>
                <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{c.text}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
