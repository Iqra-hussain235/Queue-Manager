"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import api, { apiError } from "../../../services/api";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function updateProfile(event) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      const { data } = await api.patch("/auth/me", { name });
      setUser(data.data);
      setMessage(data.message);
    } catch (requestError) { setError(apiError(requestError)); }
    finally { setBusy(false); }
  }

  async function changePassword(event) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      await api.put("/auth/password", password);
      window.localStorage.removeItem("queue-manager-token");
      setUser(null);
      router.replace("/login");
    } catch (requestError) { setError(apiError(requestError)); }
    finally { setBusy(false); }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6"><h2 className="text-2xl font-bold">Settings</h2><p className="mt-1 text-sm text-muted">Manage your profile and account security.</p></div>
      {message && <div role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
      {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <section className="card mb-5 p-6">
        <h3 className="font-bold">Profile details</h3><p className="mt-1 text-sm text-muted">{user.email}</p>
        <form className="mt-5 space-y-4" onSubmit={updateProfile}>
          <label className="block text-sm font-semibold">Name<input className="field mt-2 max-w-md" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <button className="btn btn-primary" disabled={busy}>Save profile</button>
        </form>
      </section>
      <section className="card p-6">
        <h3 className="font-bold">Change password</h3><p className="mt-1 text-sm text-muted">You will be signed out on all devices after changing your password.</p>
        <form className="mt-5 space-y-4" onSubmit={changePassword}>
          <label className="block text-sm font-semibold">Current password<input className="field mt-2 max-w-md" type="password" autoComplete="current-password" required value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /></label>
          <label className="block text-sm font-semibold">New password<input className="field mt-2 max-w-md" type="password" autoComplete="new-password" minLength={8} required value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /></label>
          <button className="btn btn-primary" disabled={busy}>Update password</button>
        </form>
      </section>
    </div>
  );
}
