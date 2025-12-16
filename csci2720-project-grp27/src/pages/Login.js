import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ setUser }) {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const res = await fetch("http://localhost:5001/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Login failed (${res.status})`);

      const token = data.token || data.accessToken || data.jwt;
      if (!token) throw new Error("Login succeeded but no token returned by backend");

      localStorage.setItem("token", token);

      // optional: store user info if returned
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
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
      <h2>Login</h2>
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

        <button type="submit">Log in</button>
      </form>
    </div>
  );
}
