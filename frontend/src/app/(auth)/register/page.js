"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { apiError } from "../../../services/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirmation: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (values.password !== values.confirmation) return setError("Passwords do not match.");
    if (values.password.length < 8) return setError("Password must contain at least 8 characters.");
    setBusy(true);
    try {
      await register({ name: values.name, email: values.email, password: values.password });
      router.replace("/dashboard");
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-4">
      <section className="card w-full max-w-[430px] p-8">
        <div className="mb-7"><p className="text-sm font-bold text-brand">QueueFlow</p><h1 className="mt-3 text-2xl font-bold">Create your account</h1><p className="mt-1 text-sm text-muted">Get your service queues organized.</p></div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">Name<input className="field mt-2" required minLength={2} maxLength={100} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></label>
          <label className="block text-sm font-semibold">Email<input className="field mt-2" type="email" autoComplete="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /></label>
          <label className="block text-sm font-semibold">Password<input className="field mt-2" type="password" autoComplete="new-password" minLength={8} required value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} /></label>
          <label className="block text-sm font-semibold">Confirm password<input className="field mt-2" type="password" autoComplete="new-password" required value={values.confirmation} onChange={(e) => setValues({ ...values, confirmation: e.target.value })} /></label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">Already registered? <Link className="font-semibold text-brand" href="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
