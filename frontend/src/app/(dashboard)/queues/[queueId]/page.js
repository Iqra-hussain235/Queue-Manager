"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, PhoneCall, Plus, RefreshCw } from "lucide-react";
import api, { apiError } from "../../../../services/api";
import { EmptyState, ErrorNotice, Loading } from "../../../../components/common/Notice";
import StatusBadge from "../../../../components/common/StatusBadge";

function elapsed(seconds) {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function QueueDetailPage() {
  const { queueId } = useParams();
  const [queue, setQueue] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [meta, setMeta] = useState(null);
  const [person, setPerson] = useState({ personName: "", personContact: "" });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const params = { page, limit: 50, sort: "position", order: "ASC" };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      const [queueResult, tokenResult] = await Promise.all([
        api.get(`/queues/${queueId}`),
        api.get(`/queues/${queueId}/tokens`, { params }),
      ]);
      setQueue(queueResult.data.data);
      setTokens(tokenResult.data.data);
      setMeta(tokenResult.data.meta);
      setError("");
    } catch (requestError) { setError(apiError(requestError)); }
  }, [queueId, page, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function runAction(action, successMessage) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setNotice(typeof successMessage === "function" ? successMessage(result) : successMessage);
      await load();
    } catch (requestError) { setError(apiError(requestError)); }
    finally { setBusy(false); }
  }

  async function addPerson(event) {
    event.preventDefault();
    await runAction(async () => {
      const { data } = await api.post(`/queues/${queueId}/tokens`, person);
      setPerson({ personName: "", personContact: "" });
      return data.data;
    }, (token) => `Token ${token.tokenNumber} created`);
  }

  if (!queue && !error) return <Loading />;

  const current = tokens.find((token) => token.status === "CALLED" || token.status === "SERVING");

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/queues" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white" aria-label="Back to queues"><ArrowLeft size={17} /></Link>
        <div className="min-w-0 flex-1"><h2 className="truncate text-2xl font-bold">{queue?.name || "Queue"}</h2><p className="mt-1 text-sm text-muted">{queue?.description || "Manage arrivals and service for this queue."}</p></div>
        <button onClick={load} aria-label="Refresh queue" className="btn btn-secondary"><RefreshCw size={16} /><span className="hidden sm:inline">Refresh</span></button>
      </div>
      {error && <div className="mb-4"><ErrorNotice message={error} /></div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
      {queue && <div className="mb-5 grid gap-3 sm:grid-cols-4">
        {[["Waiting", queue.stats.waiting], ["Called", queue.stats.called], ["Serving", queue.stats.serving], ["Completed", queue.stats.completed]].map(([label, count]) => (
          <div className="card p-4" key={label}><p className="text-sm text-muted">{label}</p><p className="mt-1 text-2xl font-bold">{count}</p></div>
        ))}
      </div>}
      {current && <section className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#192437] p-5 text-white">
        <div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10"><PhoneCall /></div><div><p className="text-xs uppercase tracking-wider text-slate-300">{current.status === "CALLED" ? "Now called" : "Currently serving"}</p><p className="mt-1 text-xl font-bold">{current.tokenNumber} · {current.personName}</p></div></div>
        <div className="flex gap-2">
          {current.status === "CALLED" && <button disabled={busy} className="btn bg-white text-ink" onClick={() => runAction(() => api.patch(`/tokens/${current.id}/start-service`), "Service started")}>Start service</button>}
          {current.status === "SERVING" && <button disabled={busy} className="btn bg-white text-ink" onClick={() => runAction(() => api.patch(`/tokens/${current.id}/complete`), "Service completed")}>Complete</button>}
          <button disabled={busy} className="btn bg-white/10 text-white hover:bg-white/20" onClick={() => window.confirm(`Cancel ${current.tokenNumber}?`) && runAction(() => api.patch(`/tokens/${current.id}/cancel`), "Token cancelled")}>Cancel</button>
        </div>
      </section>}
      <div className="grid items-start gap-5 xl:grid-cols-[340px_1fr]">
        <section className="card p-5">
          <h3 className="font-bold">Add a person</h3><p className="mt-1 text-sm text-muted">A token number is assigned automatically.</p>
          <form onSubmit={addPerson} className="mt-5 space-y-3">
            <label className="block text-sm font-semibold">Person name<input className="field mt-2" required maxLength={120} value={person.personName} onChange={(e) => setPerson({ ...person, personName: e.target.value })} /></label>
            <label className="block text-sm font-semibold">Contact <span className="font-normal text-muted">(optional)</span><input className="field mt-2" maxLength={40} value={person.personContact} onChange={(e) => setPerson({ ...person, personContact: e.target.value })} /></label>
            <button disabled={busy || queue?.status !== "ACTIVE"} className="btn btn-primary w-full"><Plus size={16} />{queue?.status === "ACTIVE" ? "Add to queue" : "Queue inactive"}</button>
          </form>
          <button disabled={busy} className="btn btn-secondary mt-3 w-full" onClick={() => runAction(() => api.post(`/queues/${queueId}/call-next`), "Next token called")}>Call next</button>
        </section>
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div><h3 className="font-bold">Queue tokens</h3><p className="mt-1 text-sm text-muted">{meta?.total || 0} total tokens · refreshes every 10 seconds</p></div>
            <div className="flex gap-2"><input className="field w-40" aria-label="Search people" placeholder="Search name" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /><select aria-label="Filter by status" className="field w-36" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{["WAITING", "CALLED", "SERVING", "COMPLETED", "CANCELLED"].map((item) => <option key={item}>{item}</option>)}</select></div>
          </div>
          {!tokens.length ? <EmptyState title="No matching tokens" description={search || status ? "Try changing the search or status filter." : "People added to this queue will appear here."} /> :
            <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted"><tr><th className="px-5 py-3">Token</th><th className="px-5 py-3">Person</th><th className="px-5 py-3">Position / wait</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{tokens.map((token) => (
                <tr key={token.id}>
                  <td className="px-5 py-4 font-bold text-brand">{token.tokenNumber}</td>
                  <td className="px-5 py-4"><p className="font-semibold">{token.personName}</p><p className="text-xs text-muted">{token.personContact || "No contact"}</p></td>
                  <td className="px-5 py-4">{token.status === "WAITING" ? `#${token.position}` : "—"} <span className="text-xs text-muted">· {elapsed(token.waitingSeconds)}</span></td>
                  <td className="px-5 py-4"><StatusBadge status={token.status} /></td>
                  <td className="px-5 py-4"><div className="flex items-center gap-1">
                    {token.status === "WAITING" && <><button disabled={busy || token.position <= 1} aria-label={`Move ${token.tokenNumber} up`} className="rounded-md p-2 hover:bg-slate-100" onClick={() => runAction(() => api.patch(`/tokens/${token.id}/move`, { direction: "up" }), "Queue order updated")}><ArrowUp size={16} /></button><button disabled={busy} aria-label={`Move ${token.tokenNumber} down`} className="rounded-md p-2 hover:bg-slate-100" onClick={() => runAction(() => api.patch(`/tokens/${token.id}/move`, { direction: "down" }), "Queue order updated")}><ArrowDown size={16} /></button><button disabled={busy} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => window.confirm(`Cancel ${token.tokenNumber}?`) && runAction(() => api.patch(`/tokens/${token.id}/cancel`), "Token cancelled")}>Cancel</button></>}
                    {token.status === "CALLED" && <><button disabled={busy} className="rounded-md px-2 py-1 text-xs font-semibold text-brand hover:bg-blue-50" onClick={() => runAction(() => api.patch(`/tokens/${token.id}/start-service`), "Service started")}>Start</button><button disabled={busy} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => window.confirm(`Cancel ${token.tokenNumber}?`) && runAction(() => api.patch(`/tokens/${token.id}/cancel`), "Token cancelled")}>Cancel</button></>}
                    {token.status === "SERVING" && <><button disabled={busy} className="rounded-md px-2 py-1 text-xs font-semibold text-brand hover:bg-blue-50" onClick={() => runAction(() => api.patch(`/tokens/${token.id}/complete`), "Service completed")}>Complete</button><button disabled={busy} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => window.confirm(`Cancel ${token.tokenNumber}?`) && runAction(() => api.patch(`/tokens/${token.id}/cancel`), "Token cancelled")}>Cancel</button></>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table></div>}
          {meta?.pages > 1 && <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm"><span>Page {meta.page} of {meta.pages}</span><div className="flex gap-2"><button className="btn btn-secondary py-2" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn btn-secondary py-2" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</button></div></div>}
        </section>
      </div>
    </div>
  );
}
