import {useEffect, useState} from "react";
import {useNavigate, useLocation} from "react-router-dom";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:5001/api/users/me", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
		if (!res.ok) throw new Error(await res.text());
		const data = await res.json();
        if (!cancelled) setMe(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  /*if (error) {
    return (
      <div className="profile-page" style={{ padding: 20 }}>
        Error: {error}
      </div>
    );
  }*/

    const passwordErrors = (() => {
      const errs = [];
      if (!currentPassword) errs.push("Current password is required");
      if (newPassword.length < 5) errs.push("New password must be at least 5 characters");
      if (newPassword && newPassword === currentPassword) errs.push("New password must be different from current password");
      if (confirmPassword !== newPassword) errs.push("Passwords do not match");
      return errs;
    })();

    async function handleChangePassword(e) {
        e.preventDefault();
        setSuccessMsg("");
        setError(null);
        if (passwordErrors.length) return;
        setSaving(true);
        try {
          const resp = await fetch("http://localhost:5001/api/users/change-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({
              currentPassword,
              newPassword,
            }),
          });
		  const data = await resp.json().catch(async () => ({ raw: await resp.text() }));

          if (!resp.ok) {
          const msg =
            (data && (data.error || data.message)) ??
            (typeof data === "string" ? data : JSON.stringify(data));
            throw new Error(msg || "Failed to change password.");
          }

          setSuccessMsg(data?.message || "Password updated successfully");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } catch (e) {
          console.log(e);
		  setError(e.message || "Failed to change password.");
        } finally {
          setSaving(false);
        }
    }

    return (
      <div className="profile-page" style={{ maxWidth: 720, margin: "32px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 8 }}>Profile</h1>
      <p>Manage your account details.</p>
      {loading && <div style={{ marginTop: 24 }}>Loading…</div>}
      {!loading && me && (
      <>
      <section style={{ marginTop: 24, padding: 16, border: "1px solid", borderRadius: 12 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Account</h2>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 10 }}>
          <div style={{ fontWeight: 600 }}>Username</div>
          <div>{me.username}</div>

          <div style={{ fontWeight: 600 }}>Role</div>
          <div>{me.role}</div>

          <div style={{ fontWeight: 600 }}>Member since</div>
          <div>{me.createdAt ? new Date(me.createdAt).toLocaleString() : "—"}</div>
        </div>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid", borderRadius: 12 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Change password</h2>
        <form onSubmit={handleChangePassword}>
          <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={5}
              />
              <small>
                At least 5 characters. Use a strong, unique password.
              </small>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            {passwordErrors.length > 0 && (
              <div style={{ color: "#b91c1c" }}>
                {passwordErrors.map((m, i) => <div key={i}>{m}</div>)}
              </div>
            )}

            {successMsg && (
              <div style={{ color: "#166534" }}>{successMsg}</div>
            )}

            {error && (
              <div style={{ color: "#b91c1c" }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={saving || passwordErrors.length > 0}>
                {saving ? "Saving…" : "Update password"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setSuccessMsg("");
                  setError(null);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </section>
      </>
      )}
    </div>
	);
}