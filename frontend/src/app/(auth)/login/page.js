"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { apiError } from "../../../services/api";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(values);
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
        <div className="mb-7"><p className="text-sm font-bold text-brand">QueueFlow</p><h1 className="mt-3 text-2xl font-bold">Welcome back</h1><p className="mt-1 text-sm text-muted">Sign in to manage your service queues.</p></div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">Email<input className="field mt-2" type="email" autoComplete="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /></label>
          <label className="block text-sm font-semibold">Password<input className="field mt-2" type="password" autoComplete="current-password" required value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} /></label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">New to QueueFlow? <Link className="font-semibold text-brand" href="/register">Create an account</Link></p>
      </section>
    </main>
  );
}
