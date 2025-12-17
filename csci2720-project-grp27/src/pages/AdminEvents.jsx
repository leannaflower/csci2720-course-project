import { useEffect, useMemo, useState } from "react";
import "./AdminPanel.css";

const API_BASE = "http://localhost:5001";
const authHeaders = (token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
});

export default function AdminEvents({ accessToken }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const [eventForm, setEventForm] = useState({
        id: "",
        title: "",
        venueid: "",
        date: "",
        description: "",
        presenter: "",
    });
    const [editingEventId, setEditingEventId] = useState(null);

    async function fetchEventsList() {
        const res = await fetch(`${API_BASE}/api/events`, {
            headers: authHeaders(accessToken),
            credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.items ?? [];
    }

    useEffect(() => {
        if (!accessToken) return;

        let cancelled = false;
        setLoading(true);
        setMessage("");

        fetchEventsList()
            .then((items) => {
                if (cancelled) return;
                setEvents(items);
            })
            .catch((e) => !cancelled && setMessage(e.message || "Failed to load events"))
            .finally(() => !cancelled && setLoading(false));

        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    const resetEventForm = () => {
        setEventForm({ id: "", title: "", venueid: "", date: "", description: "", presenter: "" });
        setEditingEventId(null);
    };

    const handleEventSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const method = editingEventId ? "PATCH" : "POST";
            const url = editingEventId
                ? `${API_BASE}/api/admin/events/${editingEventId}`
                : `${API_BASE}/api/admin/events`;

            const res = await fetch(url, {
                method,
                headers: authHeaders(accessToken),
                credentials: "include",
                body: JSON.stringify(eventForm),
            });

            if (!res.ok) throw new Error(await res.text());

            setEvents(await fetchEventsList());
            resetEventForm();
            setMessage("Event saved successfully.");
        } catch (err) {
            setMessage(err.message || "Failed to save event");
        }
    };

    const handleEditEvent = (evt) => {
        setEditingEventId(evt.id);
        setEventForm({
            id: evt.id,
            title: evt.title,
            venueid: evt.venueid,
            date: evt.date,
            description: evt.description ?? "",
            presenter: evt.presenter ?? "",
        });
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm(`Delete event ${id}?`)) return;
        setMessage("");

        try {
            const res = await fetch(`${API_BASE}/api/admin/events/${id}`, {
                method: "DELETE",
                headers: authHeaders(accessToken),
                credentials: "include",
            });

            if (!res.ok && res.status !== 204) throw new Error(await res.text());

            setEvents((prev) => prev.filter((e) => e.id !== id));
            if (editingEventId === id) resetEventForm();
            setMessage("Event deleted.");
        } catch (err) {
            setMessage(err.message || "Failed to delete event");
        }
    };

    const sortedEvents = useMemo(
        () => [...events].sort((a, b) => (a.title || "").localeCompare(b.title || "")),
        [events]
    );

    return (
        <div className="admin-panel">
            <h1>Event Manager</h1>
            {loading && <p>Loading…</p>}
            {message && <p className="flash">{message}</p>}

            <section className="card">
                <header>
                    <h2>{editingEventId ? "Edit Event" : "Create Event"}</h2>
                </header>

                <form className="grid-form" onSubmit={handleEventSubmit}>
                    <label>
                        Event ID
                        <input
                            value={eventForm.id}
                            onChange={(e) => setEventForm({ ...eventForm, id: e.target.value })}
                            required
                            disabled={!!editingEventId}
                        />
                    </label>

                    <label>
                        Title
                        <input
                            value={eventForm.title}
                            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                            required
                        />
                    </label>

                    <label>
                        Venue ID
                        <input
                            value={eventForm.venueid}
                            onChange={(e) => setEventForm({ ...eventForm, venueid: e.target.value })}
                            required
                        />
                    </label>

                    <label>
                        Date (e.g. 1-30/11/2025)
                        <input
                            value={eventForm.date}
                            onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                            required
                        />
                    </label>

                    <label className="span-2">
                        Description
                        <textarea
                            value={eventForm.description}
                            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        />
                    </label>

                    <label className="span-2">
                        Presenter
                        <input
                            value={eventForm.presenter}
                            onChange={(e) => setEventForm({ ...eventForm, presenter: e.target.value })}
                        />
                    </label>

                    <div className="form-actions span-2">
                        <button type="submit">{editingEventId ? "Update Event" : "Create Event"}</button>
                        {editingEventId && (
                            <button type="button" className="secondary" onClick={resetEventForm}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Venue</th>
                            <th>Date</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEvents.map((evt) => (
                            <tr key={evt.id}>
                                <td>{evt.id}</td>
                                <td>{evt.title}</td>
                                <td>{evt.venueid}</td>
                                <td>{evt.date}</td>
                                <td>
                                    <button onClick={() => handleEditEvent(evt)}>Edit</button>
                                    <button className="danger" onClick={() => handleDeleteEvent(evt.id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!sortedEvents.length && (
                            <tr>
                                <td colSpan={5}>No events available.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
}
