import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register({ setUser }) {
    const nav = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        try {
            const res = await fetch("http://localhost:5001/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || `Register failed (${res.status})`);

            const token = data.token || data.accessToken || data.jwt;
            if (!token) throw new Error("Register succeeded but no token returned by backend");

            localStorage.setItem("token", token);

            const meRes = await fetch("http://localhost:5001/api/users/me", {
                headers: { Authorization: `Bearer ${token}` },
                credentials: "include",
            });
            const meData = await meRes.json();
            setUser(meData);

            nav("/");
        } catch (e2) {
            setErr(e2.message);
        }
    };

    return (
        <div style={{ padding: 24, maxWidth: 360 }}>
            <h2>Create account</h2>
            {err && <p style={{ color: "crimson" }}>{err}</p>}

            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>Username</label>
                    <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: "100%" }}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: "100%" }}
                    />
                </div>

                <button type="submit">Sign up</button>
            </form>

            <p style={{ marginTop: 12 }}>
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </div>
    );
}