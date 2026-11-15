"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Plus, RefreshCw, X } from "lucide-react";
import api, { apiError } from "../../../services/api";
import { EmptyState, ErrorNotice, Loading } from "../../../components/common/Notice";

const blank = { name: "", description: "" };

export default function QueuesPage() {
  const [queues, setQueues] = useState(null);
  const [form, setForm] = useState(null);
  const [values, setValues] = useState(blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/queues");
      setQueues(data.data);
      setError("");
    } catch (requestError) { setError(apiError(requestError)); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startCreate() {
    setValues(blank);
    setForm({ id: null });
  }
  function startEdit(queue) {
    setValues({ name: queue.name, description: queue.description || "" });
    setForm({ id: queue.id });
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (form.id) await api.put(`/queues/${form.id}`, values);
      else await api.post("/queues", values);
      setForm(null);
      await load();
    } catch (requestError) { setError(apiError(requestError)); }
    finally { setBusy(false); }
  }
  async function toggle(queue) {
    try {
      await api.patch(`/queues/${queue.id}/status`, { status: queue.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
      await load();
    } catch (requestError) { setError(apiError(requestError)); }
  }
  async function remove(queue) {
    if (!window.confirm(`Delete “${queue.name}”? Queues with token history cannot be deleted.`)) return;
    try {
      await api.delete(`/queues/${queue.id}`);
      await load();
    } catch (requestError) { setError(apiError(requestError)); }
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold">Queues</h2><p className="mt-1 text-sm text-muted">Create and manage your service queues.</p></div>
        <button onClick={startCreate} className="btn btn-primary"><Plus size={17} />New queue</button>
      </div>
      {error && <div className="mb-5"><ErrorNotice message={error} /></div>}
      {form && <div className="fixed inset-0 z-20 grid place-items-center bg-slate-900/40 p-4">
        <section className="card w-full max-w-lg p-6">
          <div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-bold">{form.id ? "Edit queue" : "Create a queue"}</h3><button onClick={() => setForm(null)} aria-label="Close"><X size={20} /></button></div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-semibold">Queue name<input className="field mt-2" required minLength={2} maxLength={120} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></label>
            <label className="block text-sm font-semibold">Description <span className="font-normal text-muted">(optional)</span><textarea className="field mt-2 min-h-24" maxLength={1000} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} /></label>
            <div className="flex justify-end gap-2"><button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>Cancel</button><button disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Save queue"}</button></div>
          </form>
        </section>
      </div>}
      {!queues ? <Loading /> : queues.length === 0 ? <section className="card"><EmptyState title="No queues created" description="Create your first queue to start serving people." action={<button onClick={startCreate} className="btn btn-primary"><Plus size={16} />Create queue</button>} /></section> :
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{queues.map((queue) => (
          <article className="card p-5" key={queue.id}>
            <div className="flex items-start justify-between"><div className="min-w-0"><h3 className="truncate text-lg font-bold">{queue.name}</h3><p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted">{queue.description || "No description provided."}</p></div><span className={`badge ${queue.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{queue.status.toLowerCase()}</span></div>
            <div className="my-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
              <div><p className="text-lg font-bold">{queue.stats.waiting}</p><p className="text-[11px] text-muted">Waiting</p></div>
              <div><p className="text-lg font-bold">{queue.stats.serving + queue.stats.called}</p><p className="text-[11px] text-muted">In service</p></div>
              <div><p className="text-lg font-bold">{queue.stats.completed}</p><p className="text-[11px] text-muted">Completed</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn btn-primary flex-1" href={`/queues/${queue.id}`}>Open queue <ArrowRight size={15} /></Link>
              <button className="btn btn-secondary" title="Edit queue" onClick={() => startEdit(queue)}>Edit</button>
              <button className="btn btn-secondary" onClick={() => toggle(queue)}>{queue.status === "ACTIVE" ? "Pause" : "Activate"}</button>
              <button className="btn btn-danger" onClick={() => remove(queue)}>Delete</button>
            </div>
          </article>
        ))}</div>}
      <button onClick={load} className="mt-5 inline-flex items-center gap-2 text-sm text-muted"><RefreshCw size={14} />Refresh</button>
    </div>
  );
}
