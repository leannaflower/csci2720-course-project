import { useEffect, useMemo, useState } from "react";
import "./AdminPanel.css";

/**
 * Utility to keep fetch calls concise.
 */
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
});

export default function AdminPanel({ accessToken }) {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);

  const [eventForm, setEventForm] = useState({
    id: "",
    title: "",
    venueid: "",
    date: "",
    description: "",
    presenter: ""
  });
  const [editingEventId, setEditingEventId] = useState(null);

  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "user"
  });
  const [editingUserId, setEditingUserId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* ------------------------------------------------------------------
   * bootstrap data
   * ----------------------------------------------------------------*/
  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setLoading(true);

    const fetchEvents = fetch("/api/events", {
      headers: authHeaders(accessToken)
    })
      .then((res) => res.json())
      .then((data) => data.items ?? []);

    const fetchUsers = fetch("/api/users", {
      headers: authHeaders(accessToken)
    }).then((res) => res.json());

    Promise.all([fetchEvents, fetchUsers])
      .then(([eventItems, userItems]) => {
        if (cancelled) return;
        setEvents(eventItems);
        setUsers(userItems);
      })
      .catch(() => !cancelled && setMessage("Failed to load admin data"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const resetEventForm = () => {
    setEventForm({
      id: "",
      title: "",
      venueid: "",
      date: "",
      description: "",
      presenter: ""
    });
    setEditingEventId(null);
  };

  const resetUserForm = () => {
    setUserForm({
      username: "",
      password: "",
      role: "user"
    });
    setEditingUserId(null);
  };

  /* ------------------------------------------------------------------
   * Event CRUD
   * ----------------------------------------------------------------*/
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const method = editingEventId ? "PATCH" : "POST";
      const url = editingEventId
        ? `/api/admin/events/${editingEventId}`
        : "/api/admin/events";

      const res = await fetch(url, {
        method,
        headers: authHeaders(accessToken),
        body: JSON.stringify(eventForm)
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to save event");
      }

      const refreshed = await fetch("/api/events", {
        headers: authHeaders(accessToken)
      }).then((r) => r.json());
      setEvents(refreshed.items ?? []);
      resetEventForm();
      setMessage("Event saved successfully.");
    } catch (err) {
      setMessage(err.message);
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
      presenter: evt.presenter ?? ""
    });
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm(`Delete event ${id}?`)) return;
    setMessage("");

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
        headers: authHeaders(accessToken)
      });

      if (!res.ok && res.status !== 204) {
        const { error } = await res.json();
        throw new Error(error || "Failed to delete event");
      }

      setEvents((prev) => prev.filter((evt) => evt.id !== id));
      if (editingEventId === id) resetEventForm();
      setMessage("Event deleted.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  /* ------------------------------------------------------------------
   * User CRUD
   * ----------------------------------------------------------------*/
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const method = editingUserId ? "PATCH" : "POST";
      const url = editingUserId ? `/api/users/${editingUserId}` : "/api/users";

      const payload = { role: userForm.role };
      if (!editingUserId) {
        payload.username = userForm.username;
        payload.password = userForm.password;
      } else if (userForm.password.trim()) {
        payload.password = userForm.password;
      }

      const res = await fetch(url, {
        method,
        headers: authHeaders(accessToken),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to save user");
      }

      const refreshed = await fetch("/api/users", {
        headers: authHeaders(accessToken)
      }).then((r) => r.json());

      setUsers(refreshed);
      resetUserForm();
      setMessage("User saved successfully.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleEditUser = (user) => {
    setEditingUserId(user._id || user.id);
    setUserForm({
      username: user.username,
      password: "",
      role: user.role
    });
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    setMessage("");

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: authHeaders(accessToken)
      });

      if (!res.ok && res.status !== 204) {
        const { error } = await res.json();
        throw new Error(error || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((user) => (user._id || user.id) !== userId));
      if (editingUserId === userId) resetUserForm();
      setMessage("User deleted.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  /* ------------------------------------------------------------------
   * render helpers
   * ----------------------------------------------------------------*/
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.title.localeCompare(b.title)),
    [events]
  );
  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.username.localeCompare(b.username)),
    [users]
  );

  return (
    <div className="admin-panel">
      <h1>Admin Dashboard</h1>
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
              onChange={(e) =>
                setEventForm({ ...eventForm, venueid: e.target.value })
              }
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
              onChange={(e) =>
                setEventForm({ ...eventForm, description: e.target.value })
              }
            />
          </label>
          <label className="span-2">
            Presenter
            <input
              value={eventForm.presenter}
              onChange={(e) =>
                setEventForm({ ...eventForm, presenter: e.target.value })
              }
            />
          </label>
          <div className="form-actions span-2">
            <button type="submit">
              {editingEventId ? "Update Event" : "Create Event"}
            </button>
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

      <section className="card">
        <header>
          <h2>{editingUserId ? "Edit User" : "Create User"}</h2>
        </header>
        <form className="grid-form" onSubmit={handleUserSubmit}>
          <label>
            Username
            <input
              value={userForm.username}
              onChange={(e) =>
                setUserForm({ ...userForm, username: e.target.value.toLowerCase() })
              }
              required
              disabled={!!editingUserId}
            />
          </label>
          <label>
            Password {editingUserId && <small>(leave blank to keep current)</small>}
            <input
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              required={!editingUserId}
            />
          </label>
          <label>
            Role
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <div className="form-actions">
            <button type="submit">
              {editingUserId ? "Update User" : "Create User"}
            </button>
            {editingUserId && (
              <button type="button" className="secondary" onClick={resetUserForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => {
              const id = user._id || user.id;
              return (
                <tr key={id}>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}</td>
                  <td>
                    <button onClick={() => handleEditUser(user)}>Edit</button>
                    <button className="danger" onClick={() => handleDeleteUser(id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {!sortedUsers.length && (
              <tr>
                <td colSpan={4}>No users available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
