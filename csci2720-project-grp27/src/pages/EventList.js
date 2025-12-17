import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./EventList.css";

export default function EventsList() {
  const token = localStorage.getItem("token");
  const [searchParams, setSearchParams] = useSearchParams();

  // params
  const urlKeyword = searchParams.get("keyword") || "";
  const sort = searchParams.get("sort") || "date"; // "date" | "title" | "venue" | "presenter"
  const order = searchParams.get("order") || "asc"; // "asc" | "desc"
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 20);
  const venueid = searchParams.get("venueid") || "";
  const urlPresenter = searchParams.get("presenter") || "";

  const [localKeyword, setLocalKeyword] = useState(urlKeyword);
  const [localPresenter, setLocalPresenter] = useState(urlPresenter);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    setLocalKeyword(urlKeyword);
  }, [urlKeyword]);

  useEffect(() => {
    setLocalPresenter(urlPresenter);
  }, [urlPresenter]);

  useEffect(() => {
    const h = setTimeout(() => {
      if (localKeyword !== urlKeyword) {
        updateParam("keyword", localKeyword);
      }
    }, 350);
    return () => clearTimeout(h);
  }, [localKeyword, urlKeyword]);

  useEffect(() => {
    const h = setTimeout(() => {
      if (localPresenter !== urlPresenter) {
        updateParam("presenter", localPresenter);
      }
    }, 350);
    return () => clearTimeout(h);
  }, [localPresenter, urlPresenter]);

  function updateParam(key, value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const v = String(value ?? "");
      if (v === "" || v === "All") next.delete(key);
      else next.set(key, v);
      if (
        ["keyword", "presenter", "venueid", "sort", "order", "pageSize"].includes(
          key
        )
      ) {
        next.delete("page");
      }
    return next;
    });
  }

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);

  const [venues, setVenues] = useState([]);

  const [expanded, setExpanded] = useState(() => new Set());

  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) return;
      try {
        const res = await fetch(
          `http://localhost:5001/api/venues?t=${Date.now()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!cancelled) setVenues(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("load venues failed", e);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const firstLoad = loading && !refreshing;

    const run = async () => {
      if (firstLoad) setLoading(true);
      else setRefreshing(true);
      setError("");
      if (!token) {
        setError("No token found. Please log in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      try {
        const qs = new URLSearchParams();
        if (urlKeyword) qs.set("q", urlKeyword);
        if (venueid) qs.set("venueid", venueid);
        if (urlPresenter) qs.set("presenter", urlPresenter);
        qs.set("limit", String(pageSize));
        qs.set("offset", String((page - 1) * pageSize));
        qs.set("sort", sort);
        qs.set("order", order);
        const res = await fetch(
          `http://localhost:5001/api/events?${qs.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Cache-Control": "no-cache",
            },
            credentials: "include",
            cache: "no-store",
          }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!cancelled) {
          setEvents(Array.isArray(data.items) ? data.items : []);
          setTotal(data.total ?? 0);
		  setLastUpdated(new Date());
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e.message || "Failed to load events");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    token,
    urlKeyword,
    sort,
    order,
    page,
    pageSize,
    venueid,
    urlPresenter,
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function setSort(field) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const currentSort = next.get("sort") || "date";
      const currentOrder = next.get("order") || "asc";
      const nextOrder =
      field === currentSort && currentOrder === "asc" ? "desc" : "asc";
	  next.set("sort", field);
      next.set("order", nextOrder);
      next.delete("page");
      return next;
    });
  }

  function goPage(p) {
    updateParam("page", Math.min(Math.max(1, p), totalPages));
  }

  useEffect(() => {
    setExpanded(new Set());
  }, [sort, order, page, pageSize, urlKeyword, venueid, urlPresenter]);

  const visibleEvents = useMemo(() => events, [events]);

  if (loading) {
    return (
      <div className="events-page" style={{ padding: 20 }}>
        Loading events…
      </div>
    );
  }
  if (error) {
    return (
      <div className="events-page" style={{ padding: 20 }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="events-page">
      <h2 className="title">All Events</h2>

      <div className="filter-panel">
        <input
          type="text"
          placeholder="Search events…"
          value={localKeyword}
          onChange={(e) => setLocalKeyword(e.target.value)}
          className="filter-search"
        />

        <label className="filter-label">Venue:</label>
        <select
          value={venueid}
          onChange={(e) => updateParam("venueid", e.target.value)}
          className="venue-dropdown"
        >
          <option value="">All</option>
          {venues
            .slice()
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
            .map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
        </select>

        <label className="filter-label">Presenter:</label>
        <input
          type="text"
          placeholder="Filter by presenter…"
          value={localPresenter}
          onChange={(e) => setLocalPresenter(e.target.value)}
          className="filter-search"
          style={{ minWidth: 200 }}
        />

        <div className="spacer" />

        <label className="filter-label">Page size:</label>
        <select
          value={pageSize}
          onChange={(e) => updateParam("pageSize", Number(e.target.value))}
          className="page-size-dropdown"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <div className="pagination">
          <button onClick={() => goPage(1)} disabled={page <= 1}>
            ⏮
          </button>
          <button onClick={() => goPage(page - 1)} disabled={page <= 1}>
            ◀
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}>
            ▶
          </button>
          <button
            onClick={() => goPage(totalPages)}
            disabled={page >= totalPages}
          >
            ⏭
          </button>
        </div>
      </div>

      {refreshing && (
        <div style={{ padding: "4px 0", fontSize: 12, color: "#666" }}>
          Updating…
        </div>
      )}

      {visibleEvents.length === 0 ? (
        <div style={{ padding: 12 }}>No events found.</div>
      ) : (
        <table className="events-table">
          <thead>
            <tr>
              <th>ID</th>
              <th onClick={() => setSort("title")} className="sortable">
                Event {sort === "title" && (order === "asc" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => setSort("date")}
                className="sortable"
                style={{ width: 240 }}
              >
                Date {sort === "date" && (order === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => setSort("venue")} className="sortable">
                Venue {sort === "venue" && (order === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => setSort("presenter")} className="sortable">
                Presenter {sort === "presenter" && (order === "asc" ? "▲" : "▼")}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleEvents.map((ev) => {
              const isExpanded = expanded.has(ev.id);
              const venueName = ev.venueName || ev.venue || "";
              return (
                <React.Fragment key={ev.id}>
                  <tr
                    className="event-row"
                    onClick={() => toggleExpand(ev.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{ev.id}</td>
                    <td>
                      <div className="event-title">
                          {ev.title}
                      </div>
                    </td>
                    <td>
                      <div className="event-date" title={ev.date}>
                        {ev.date}
                      </div>
                    </td>
                    <td>
                      <div className="venue-name">
                        <Link
                          className="venue-link"
                          to={`/location/${ev.venueid}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {venueName}
                        </Link>
                      </div>
                    </td>
                    <td>{ev.presenter || "-"}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="event-desc-row">
                      <td colSpan={5}>
                        {ev.description ? (
                          <div className="event-description">
                            {ev.description}
                          </div>
                        ) : (
                          <em style={{ color: "#666" }}>No description.</em>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
	  
	  <div className="page-footer">
        {lastUpdated ? (
        <span>
          Last updated: {new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          }).format(lastUpdated)}
        </span>
        ) : (
        <span>Last updated: —</span>
        )}
      </div>
    </div>
  );
}