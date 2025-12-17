import { useEffect, useMemo, useState } from "react";
import "./AdminPanel.css";

const API_BASE = "http://localhost:5001";
const authHeaders = (token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
});

export default function AdminUsers({ accessToken, currentUser }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const [userForm, setUserForm] = useState({
        username: "",
        password: "",
        role: "user",
    });
    const [editingUserId, setEditingUserId] = useState(null);

    async function fetchUsersList() {
        const res = await fetch(`${API_BASE}/api/users`, {
            headers: authHeaders(accessToken),
            credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    }

    useEffect(() => {
        if (!accessToken) return;

        let cancelled = false;
        setLoading(true);
        setMessage("");

        fetchUsersList()
            .then((items) => {
                if (cancelled) return;
                setUsers(items);
            })
            .catch((e) => !cancelled && setMessage(e.message || "Failed to load users"))
            .finally(() => !cancelled && setLoading(false));

        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    const resetUserForm = () => {
        setUserForm({ username: "", password: "", role: "user" });
        setEditingUserId(null);
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const method = editingUserId ? "PATCH" : "POST";
            const url = editingUserId
                ? `${API_BASE}/api/users/${editingUserId}`
                : `${API_BASE}/api/users`;

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
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());

            setUsers(await fetchUsersList());
            resetUserForm();
            setMessage("User saved successfully.");
        } catch (err) {
            setMessage(err.message || "Failed to save user");
        }
    };

    const handleEditUser = (user) => {
        setEditingUserId(user._id || user.id);
        setUserForm({ username: user.username, password: "", role: user.role });
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Delete this user?")) return;
        setMessage("");

        try {
            const res = await fetch(`${API_BASE}/api/users/${userId}`, {
                method: "DELETE",
                headers: authHeaders(accessToken),
                credentials: "include",
            });

            if (!res.ok && res.status !== 204) throw new Error(await res.text());

            setUsers((prev) => prev.filter((u) => (u._id || u.id) !== userId));
            if (editingUserId === userId) resetUserForm();
            setMessage("User deleted.");
        } catch (err) {
            setMessage(err.message || "Failed to delete user");
        }
    };

    const sortedUsers = useMemo(
        () => [...users].sort((a, b) => (a.username || "").localeCompare(b.username || "")),
        [users]
    );

    return (
        <div className="admin-panel">
            <h1>User Manager</h1>
            {loading && <p>Loading…</p>}
            {message && <p className="flash">{message}</p>}

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
                            disabled={!!editingUserId && currentUser?.username === userForm.username}
                            title={
                                !!editingUserId && currentUser?.username === userForm.username
                                    ? "You cannot change your own role"
                                    : ""
                            }
                        >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </label>

                    <div className="form-actions">
                        <button type="submit">{editingUserId ? "Update User" : "Create User"}</button>
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
                        {sortedUsers.map((u) => {
                            const id = u._id || u.id;
                            const isSelf = currentUser?.username === u.username;

                            return (
                                <tr key={id}>
                                    <td>{u.username}</td>
                                    <td>{u.role}</td>
                                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}</td>
                                    <td>
                                        <button onClick={() => handleEditUser(u)}>Edit</button>

                                        <button
                                            className="danger"
                                            onClick={() => handleDeleteUser(id)}
                                            disabled={isSelf}
                                            title={isSelf ? "You cannot delete yourself" : "Delete user"}
                                        >
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
